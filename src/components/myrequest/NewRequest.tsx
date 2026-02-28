// import { useState } from "react";
// import { useNavigate } from "react-router-dom";
// import { useMutation, useQueryClient } from "@tanstack/react-query";
// import { createRequest } from "@/lib/api";
// import { DOCUMENT_LABELS, type DocumentType } from "@/lib/types";
// import { Button } from "@/components/ui/button";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import { Textarea } from "@/components/ui/textarea";
// import { toast } from "@/hooks/use-toast";
// import { ArrowLeft, FileText, Send } from "lucide-react";

// const DOC_TYPES = Object.entries(DOCUMENT_LABELS) as [DocumentType, string][];

// export default function NewRequest() {
//   const navigate = useNavigate();
//   const queryClient = useQueryClient();
//   const [selectedType, setSelectedType] = useState<DocumentType | "">("");
//   const [purpose, setPurpose] = useState("");

//   const mutation = useMutation({
//     mutationFn: createRequest,
//     onSuccess: () => {
//       queryClient.invalidateQueries({ queryKey: ["requests"] });
//       toast({
//         title: "Request Submitted",
//         description: "Your document request has been submitted successfully.",
//       });
//       navigate("/");
//     },
//   });

//   const handleSubmit = (e: React.FormEvent) => {
//     e.preventDefault();
//     if (!selectedType || !purpose.trim()) {
//       toast({
//         title: "Missing Information",
//         description: "Please select a document type and provide a purpose.",
//         variant: "destructive",
//       });
//       return;
//     }
//     mutation.mutate({ document_type: selectedType, purpose: purpose.trim() });
//   };

//   return (
//     <div className="max-w-lg mx-auto animate-fade-in">
//       <Button variant="ghost" className="gap-2 mb-4" onClick={() => navigate(-1)}>
//         <ArrowLeft className="h-4 w-4" /> Back
//       </Button>

//       <Card>
//         <CardHeader>
//           <CardTitle className="flex items-center gap-2">
//             <FileText className="h-5 w-5 text-primary" />
//             New Document Request
//           </CardTitle>
//         </CardHeader>
//         <CardContent>
//           <form onSubmit={handleSubmit} className="space-y-5">
//             <div className="space-y-2">
//               <Label>Document Type</Label>
//               <div className="grid grid-cols-1 gap-2">
//                 {DOC_TYPES.map(([value, label]) => (
//                   <button
//                     key={value}
//                     type="button"
//                     onClick={() => setSelectedType(value)}
//                     className={`text-left p-3 rounded-lg border text-sm transition-all ${
//                       selectedType === value
//                         ? "border-primary bg-primary/5 font-medium"
//                         : "border-border hover:border-primary/40 hover:bg-muted/50"
//                     }`}
//                   >
//                     {label}
//                   </button>
//                 ))}
//               </div>
//             </div>

//             <div className="space-y-2">
//               <Label htmlFor="purpose">Purpose</Label>
//               <Textarea
//                 id="purpose"
//                 placeholder="e.g., Employment requirement, business permit..."
//                 value={purpose}
//                 onChange={(e) => setPurpose(e.target.value)}
//                 rows={3}
//               />
//             </div>

//             <div className="space-y-2">
//               <Label htmlFor="file">Attach Supporting Documents (optional)</Label>
//               <Input id="file" type="file" multiple accept=".pdf,.jpg,.jpeg,.png" />
//               <p className="text-xs text-muted-foreground">
//                 Accepted: PDF, JPG, PNG (max 5MB each)
//               </p>
//             </div>

//             <Button
//               type="submit"
//               className="w-full gap-2"
//               disabled={mutation.isPending}
//             >
//               <Send className="h-4 w-4" />
//               {mutation.isPending ? "Submitting..." : "Submit Request"}
//             </Button>
//           </form>
//         </CardContent>
//       </Card>
//     </div>
//   );
// }
