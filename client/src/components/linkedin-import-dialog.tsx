import React, { useState } from "react";
import { Upload, X, CheckCircle2, AlertCircle, Loader2, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { InsertContact } from "@shared/schema";
import JSZip from "jszip";

interface LinkedInImportDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ParsedContact {
  name: string;
  email: string;
  company: string;
  role: string;
  valid: boolean;
  error?: string;
  url?: string;
}

interface ImportResult {
  created: number;
  skipped: number;
  failed: number;
  skippedEmails: string[];
  profileCreated?: boolean;
  filesProcessed?: {
    profile: boolean;
    positions: boolean;
    connections: boolean;
  };
}

interface ProfilePreview {
  firstName?: string;
  lastName?: string;
  headline?: string;
  currentCompany?: string;
  currentRole?: string;
}

export function LinkedInImportDialog({ isOpen, onClose }: LinkedInImportDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [parsedContacts, setParsedContacts] = useState<ParsedContact[]>([]);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [isZipMode, setIsZipMode] = useState(false);
  const [profilePreview, setProfilePreview] = useState<ProfilePreview | null>(null);
  const { toast } = useToast();

  const parseCSV = (text: string): ParsedContact[] => {
    // Remove BOM if present
    const cleanText = text.replace(/^\uFEFF/, '');
    const lines = cleanText.split(/\r?\n/).filter(line => line.trim());

    if (lines.length < 2) {
      toast({
        title: "Invalid CSV",
        description: "The file appears to be empty or invalid.",
        variant: "destructive",
      });
      return [];
    }

    // Robust CSV line parser that handles quotes
    const parseLine = (line: string): string[] => {
      const values: string[] = [];
      let currentValue = '';
      let inQuotes = false;

      for (let i = 0; i < line.length; i++) {
        const char = line[i];

        if (char === '"') {
          if (i + 1 < line.length && line[i + 1] === '"') {
            currentValue += '"';
            i++; // Skip next quote
          } else {
            inQuotes = !inQuotes;
          }
        } else if (char === ',' && !inQuotes) {
          values.push(currentValue.trim());
          currentValue = '';
        } else {
          currentValue += char;
        }
      }
      values.push(currentValue.trim());
      return values;
    };

    // Find header row
    let headerRowIndex = -1;
    let header: string[] = [];

    for (let i = 0; i < Math.min(lines.length, 20); i++) {
      const row = parseLine(lines[i]).map(h => h.toLowerCase().replace(/[^a-z0-9]/g, ''));
      // Check if this row looks like a header (has first name, last name, email)
      if (
        row.some(c => c.includes('firstname') || c.includes('first')) &&
        row.some(c => c.includes('lastname') || c.includes('last'))
      ) {
        headerRowIndex = i;
        header = row;
        break;
      }
    }

    if (headerRowIndex === -1) {
      // Fallback to first line if no header found (though likely will fail validation)
      headerRowIndex = 0;
      header = parseLine(lines[0]).map(h => h.toLowerCase().replace(/[^a-z0-9]/g, ''));
    }

    console.log('Debug - Header Found at index:', headerRowIndex);
    console.log('Debug - Header:', header);

    // Find column indices with flexible matching
    const findCol = (patterns: string[]) =>
      header.findIndex(h => patterns.some(p => h.includes(p)));

    const firstNameIdx = findCol(['firstname', 'first']);
    const lastNameIdx = findCol(['lastname', 'last']);
    const emailIdx = findCol(['email', 'e-mail']);
    const companyIdx = findCol(['company', 'organization']);
    const positionIdx = findCol(['position', 'role', 'job', 'title']);
    const urlIdx = findCol(['url', 'linkedin', 'profile']);

    console.log('Debug - Indices:', { firstNameIdx, lastNameIdx, emailIdx, companyIdx, positionIdx, urlIdx });

    const contacts: ParsedContact[] = [];

    // Parse data rows starting after header
    for (let i = headerRowIndex + 1; i < lines.length; i++) {
      const values = parseLine(lines[i]);

      // Skip empty rows
      if (values.length === 0 || (values.length === 1 && !values[0])) continue;

      const firstName = firstNameIdx >= 0 ? values[firstNameIdx] : '';
      const lastName = lastNameIdx >= 0 ? values[lastNameIdx] : '';
      const email = emailIdx >= 0 ? values[emailIdx] : '';
      // Ensure company and role are not undefined or empty
      const company = (companyIdx >= 0 && values[companyIdx]) ? values[companyIdx] : 'Unknown';
      const role = (positionIdx >= 0 && values[positionIdx]) ? values[positionIdx] : 'Unknown';
      const url = urlIdx >= 0 ? values[urlIdx] : '';

      const name = `${firstName} ${lastName}`.trim();

      // Validate
      let valid = true;
      let error: string | undefined;

      if (!name) {
        valid = false;
        error = "Missing name";
      } else if (email && !email.includes('@')) {
        // Only validate email if it exists
        valid = false;
        error = "Invalid email";
      }

      contacts.push({
        name,
        email,
        company,
        role,
        valid,
        error,
        url,
        // Add debug info to the object for display
        _debug: i === headerRowIndex + 1 ? { header: header, values, indices: { firstNameIdx, lastNameIdx, emailIdx, companyIdx, positionIdx, urlIdx } } : undefined
      } as any);
    }

    return contacts;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.name.endsWith('.csv')) {
      toast({
        title: "Invalid file type",
        description: "Please upload a CSV file.",
        variant: "destructive",
      });
      return;
    }

    setFile(selectedFile);
    setImportResult(null);

    // Read and parse the file
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const contacts = parseCSV(text);
      setParsedContacts(contacts);
    };
    reader.readAsText(selectedFile);
  };

  const importMutation = useMutation({
    mutationFn: async () => {
      if (isZipMode && file) {
        // Handle ZIP file upload
        const arrayBuffer = await file.arrayBuffer();
        const base64 = btoa(
          new Uint8Array(arrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
        );

        const response = await apiRequest("POST", "/api/linkedin/import-zip", { zipData: base64 });
        return await response.json();
      } else {
        // Handle CSV upload (existing logic)
        const validContacts = parsedContacts.filter(c => c.valid);
        const contactsToImport: InsertContact[] = validContacts.map(c => ({
          name: c.name,
          email: c.email || undefined,
          company: c.company,
          role: c.role,
          location: "Unknown",
          warmthScore: 0,
          priorityScore: 50,
          tags: ["LinkedIn Import"],
          notes: c.url ? `LinkedIn: ${c.url}\nImported from LinkedIn connections` : "Imported from LinkedIn connections",
        }));

        const response = await apiRequest("POST", "/api/contacts/bulk", contactsToImport);
        return await response.json();
      }
    },
    onSuccess: (result) => {
      setImportResult(result);
      queryClient.invalidateQueries({ queryKey: ["/api/contacts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });

      const message = isZipMode && result.profileCreated
        ? `Successfully imported ${result.created} contacts and built your profile!`
        : `Successfully imported ${result.created} contacts. ${result.skipped} duplicates skipped.`;

      toast({
        title: "Import complete",
        description: message,
      });
    },
    onError: (error: any) => {
      console.error("Import error:", error);
      toast({
        title: "Import failed",
        description: error.message || "An error occurred while importing contacts. Please check the console for details.",
        variant: "destructive",
      });
    },
  });

  const handleImport = () => {
    importMutation.mutate();
  };

  const handleClose = () => {
    setFile(null);
    setParsedContacts([]);
    setImportResult(null);
    onClose();
  };

  const validCount = parsedContacts.filter(c => c.valid).length;
  const invalidCount = parsedContacts.filter(c => !c.valid).length;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl">Import LinkedIn Connections</DialogTitle>
          <DialogDescription>
            Upload your LinkedIn export (CSV or ZIP) to import contacts and build your profile.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* File Upload */}
          {!file && !importResult && (
            <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
              <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="font-medium mb-2">Upload LinkedIn Export</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Upload your LinkedIn export ZIP file (recommended) or just the Connections CSV.
              </p>
              <label htmlFor="csv-upload">
                <Button asChild>
                  <span>Choose File</span>
                </Button>
                <input
                  id="csv-upload"
                  type="file"
                  accept=".csv,.zip"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </label>
            </div>
          )}

          {/* Preview */}
          {file && parsedContacts.length > 0 && !importResult && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Preview: {file.name}</h3>
                  {isZipMode && (
                    <p className="text-xs text-muted-foreground mt-1">
                      ZIP mode: Profile building + Smart matching enabled
                    </p>
                  )}
                  <div className="flex gap-2 mt-2">
                    <Badge variant="secondary" className="bg-green-50 text-green-700 border-green-200">
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      {validCount} valid
                    </Badge>
                    {invalidCount > 0 && (
                      <Badge variant="secondary" className="bg-red-50 text-red-700 border-red-200">
                        <AlertCircle className="w-3 h-3 mr-1" />
                        {invalidCount} invalid
                      </Badge>
                    )}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setFile(null);
                    setParsedContacts([]);
                    setProfilePreview(null);
                  }}
                >
                  <X className="w-4 h-4 mr-2" />
                  Clear
                </Button>
              </div>

              {/* Profile Preview */}
              {profilePreview && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <User className="w-4 h-4 text-blue-600" />
                    <h4 className="font-medium text-blue-900">Your Profile</h4>
                  </div>
                  <div className="text-sm space-y-1">
                    {profilePreview.firstName && profilePreview.lastName && (
                      <p><span className="font-medium">Name:</span> {profilePreview.firstName} {profilePreview.lastName}</p>
                    )}
                    {profilePreview.headline && (
                      <p><span className="font-medium">Headline:</span> {profilePreview.headline}</p>
                    )}
                    {profilePreview.currentRole && (
                      <p><span className="font-medium">Current Role:</span> {profilePreview.currentRole}</p>
                    )}
                    {profilePreview.currentCompany && (
                      <p><span className="font-medium">Company:</span> {profilePreview.currentCompany}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Debug Info for 0 valid contacts */}
              {validCount === 0 && (
                <div className="bg-slate-100 p-4 rounded-md text-xs font-mono overflow-auto max-h-40">
                  <p className="font-bold text-red-600 mb-2">Debug Info (No valid contacts found):</p>
                  <p>Parsed {parsedContacts.length} rows.</p>
                  <p>Sample Row 1 Raw: {JSON.stringify(parsedContacts[0])}</p>
                  <p>Please check if your CSV headers match standard LinkedIn format.</p>
                </div>
              )}

              <ScrollArea className="h-[300px] border rounded-lg">
                <div className="p-4 space-y-2">
                  {parsedContacts.map((contact, idx) => (
                    <div
                      key={idx}
                      className={`p-3 rounded-lg border ${contact.valid
                        ? "bg-white border-border"
                        : "bg-red-50 border-red-200"
                        }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="font-medium">{contact.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {contact.role} at {contact.company}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {contact.email}
                          </div>
                        </div>
                        {!contact.valid && (
                          <Badge variant="destructive" className="text-xs">
                            {contact.error}
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              <div className="flex gap-3">
                <Button
                  onClick={handleImport}
                  disabled={validCount === 0 || importMutation.isPending}
                  className="flex-1"
                >
                  {importMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Importing...
                    </>
                  ) : (
                    <>Import {validCount} Contacts</>
                  )}
                </Button>
                <Button variant="outline" onClick={handleClose}>
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* Results */}
          {importResult && (
            <div className="space-y-4">
              <div className="text-center py-6">
                <CheckCircle2 className="w-16 h-16 mx-auto mb-4 text-green-600" />
                <h3 className="font-serif text-xl font-medium mb-2">Import Complete!</h3>
                <div className="space-y-1 text-sm text-muted-foreground">
                  <p>✓ {importResult.created} contacts imported successfully</p>
                  {importResult.skipped > 0 && (
                    <p>⊘ {importResult.skipped} duplicates skipped</p>
                  )}
                  {importResult.failed > 0 && (
                    <p className="text-red-600">✗ {importResult.failed} failed</p>
                  )}
                </div>
              </div>

              {importResult.skippedEmails?.length > 0 && (
                <div className="bg-muted/30 rounded-lg p-4">
                  <h4 className="text-sm font-medium mb-2">Skipped (already exist):</h4>
                  <div className="text-xs text-muted-foreground space-y-1">
                    {importResult.skippedEmails.map((email, idx) => (
                      <div key={idx}>• {email}</div>
                    ))}
                  </div>
                </div>
              )}

              <Button onClick={handleClose} className="w-full">
                Done
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
