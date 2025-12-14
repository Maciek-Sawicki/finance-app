// "use client";

// import { useEffect, useState, Fragment } from "react";
// import {
//   Table,
//   TableBody,
//   TableCell,
//   TableHead,
//   TableHeader,
//   TableRow,
// } from "@/components/ui/table";
// import { Button } from "@/components/ui/button";
// import { ChevronDown, Trash2 } from "lucide-react";
// import { ImportService } from "@/services/imports";
// import type { ImportRecord, ImportTransaction } from "@/lib/types";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select";
// import { useCategories } from "@/contexts/CategoriesContext";
// import { useAccounts } from "@/contexts/AccountsContext";
// import { useUserSettings } from "@/contexts/UserSettingsContext";

// export default function ImportsTable() {
//   const [imports, setImports] = useState<ImportRecord[]>([]);
//   const [expanded, setExpanded] = useState<string | null>(null);
//   const [transactions, setTransactions] = useState<
//     Record<string, ImportTransaction[]>
//   >({});
//   const { categories } = useCategories();
//   const { accounts } = useAccounts();
//   const { settings } = useUserSettings();

//   const locale = settings?.locale ?? "en-US";

//   const getAccountName = (accountId: string) =>
//     accounts.find((a) => a._id === accountId)?.name || "Unknown";

//   const loadImports = async () => {
//     const data = await ImportService.getImports();
//     setImports(data);
//   };

//   const toggleExpand = async (importId: string) => {
//     if (expanded === importId) {
//       setExpanded(null);
//       return;
//     }

//     if (!transactions[importId]) {
//       const tx = await ImportService.getImportTransactions(importId);
//       setTransactions((prev) => ({ ...prev, [importId]: tx }));
//     }

//     setExpanded(importId);
//   };

//   const formatCurrency = (amount: number, currency: string) => {
//     return new Intl.NumberFormat(locale || "en-US", {
//       style: "currency",
//       currency,
//     }).format(amount);
//   };


//   const handleDelete = async (importId: string) => {
//     if (!confirm("Delete this import and all related transactions?")) return;
//     await ImportService.deleteImport(importId);
//     loadImports();
//   };

//   const handleCategoryChange = async (
//     txId: string,
//     categoryId: string,
//     importId: string
//   ) => {
//     await ImportService.updateTransactionCategory(txId, categoryId);

//     setTransactions((prev) => ({
//       ...prev,
//       [importId]: prev[importId].map((tx) =>
//         tx._id === txId ? { ...tx, categoryId } : tx
//       ),
//     }));
//   };

//   useEffect(() => {
//     loadImports();
//   }, []);

//   return (
//     <Table>
//       <TableHeader>
//         <TableRow>
//           <TableHead />
//           <TableHead>File</TableHead>
//           <TableHead>Account</TableHead>
//           <TableHead>Import date</TableHead>
//           <TableHead>Imported</TableHead>
//           <TableHead />
//         </TableRow>
//       </TableHeader>

//       <TableBody>
//         {imports.map((imp) => (
//           <Fragment key={imp._id}>
//             <TableRow>
//               <TableCell>
//                 <Button
//                   size="icon"
//                   variant="ghost"
//                   onClick={() => toggleExpand(imp._id)}
//                 >
//                   <ChevronDown
//                     className={`transition ${expanded === imp._id ? "rotate-180" : ""
//                       }`}
//                   />
//                 </Button>
//               </TableCell>

//               <TableCell>{imp.fileName}</TableCell>
//               <TableCell>{getAccountName(imp.accountId)}</TableCell>
//               <TableCell>
//                 {new Date(imp.uploadDate).toLocaleDateString()}
//               </TableCell>
//               <TableCell>
//                 {imp.importedCount} / {imp.rowCount}
//               </TableCell>

//               <TableCell>
//                 <Button
//                   size="icon"
//                   variant="destructive"
//                   onClick={() => handleDelete(imp._id)}
//                 >
//                   <Trash2 size={16} />
//                 </Button>
//               </TableCell>
//             </TableRow>

//             {expanded === imp._id && transactions[imp._id] && (
//               <TableRow>
//                 <TableCell colSpan={6} className="bg-muted/30">
//                   <Table>
//                     <TableHeader>
//                       <TableRow>
//                         <TableHead>Date</TableHead>
//                         <TableHead>Description</TableHead>
//                         <TableHead>Amount</TableHead>
//                         <TableHead>Category</TableHead>
//                       </TableRow>
//                     </TableHeader>

//                     <TableBody>
//                       {transactions[imp._id].map((tx) => {
//                         const availableCategories = categories.filter(
//                           (cat) => cat.type === tx.type
//                         );

//                         return (
//                           <TableRow key={tx._id}>
//                             <TableCell>
//                               {new Date(tx.date).toLocaleDateString()}
//                             </TableCell>

//                             <TableCell>{tx.description}</TableCell>

//                             <TableCell
//                               className={
//                                 tx.type === "expense" ? "text-red-600" : "text-green-600"
//                               }
//                             >
//                               {tx.type === "expense" ? "-" : "+"}
//                               {formatCurrency(tx.amount, accounts.find(a => a._id === imp.accountId)?.currency || "")}
//                             </TableCell>

//                             <TableCell>
//                               <Select
//                                 value={tx.categoryId ?? ""}
//                                 onValueChange={(val) =>
//                                   handleCategoryChange(tx._id, val, imp._id)
//                                 }
//                               >
//                                 <SelectTrigger className="w-[200px]">
//                                   <SelectValue placeholder="Select category" />
//                                 </SelectTrigger>

//                                 <SelectContent>
//                                   {availableCategories.map((cat) => (
//                                     <SelectItem key={cat._id} value={cat._id}>
//                                       {cat.name}
//                                     </SelectItem>
//                                   ))}
//                                 </SelectContent>
//                               </Select>
//                             </TableCell>
//                           </TableRow>
//                         );
//                       })}
//                     </TableBody>
//                   </Table>
//                 </TableCell>
//               </TableRow>
//             )}
//           </Fragment>
//         ))}
//       </TableBody>
//     </Table>
//   );
// }

"use client";

import { useEffect, useState, Fragment } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ChevronDown, Trash2 } from "lucide-react";
import { ImportService } from "@/services/imports";
import type { ImportRecord, ImportTransaction } from "@/lib/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCategories } from "@/contexts/CategoriesContext";
import { useAccounts } from "@/contexts/AccountsContext";
import { useUserSettings } from "@/contexts/UserSettingsContext";

interface Props {
  refreshFlag?: boolean;
}

export default function ImportsTable({ refreshFlag }: Props) {
  const [imports, setImports] = useState<ImportRecord[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<
    Record<string, ImportTransaction[]>
  >({});
  const { categories } = useCategories();
  const { accounts } = useAccounts();
  const { settings } = useUserSettings();

  const locale = settings?.locale ?? "en-US";

  const getAccountName = (accountId: string) =>
    accounts.find((a) => a._id === accountId)?.name || "Unknown";

  const loadImports = async () => {
    const data = await ImportService.getImports();
    setImports(data);
  };

  const toggleExpand = async (importId: string) => {
    if (expanded === importId) {
      setExpanded(null);
      return;
    }

    if (!transactions[importId]) {
      const tx = await ImportService.getImportTransactions(importId);
      setTransactions((prev) => ({ ...prev, [importId]: tx }));
    }

    setExpanded(importId);
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
    }).format(amount);
  };

  const handleDelete = async (importId: string) => {
    if (!confirm("Delete this import and all related transactions?")) return;
    await ImportService.deleteImport(importId);
    loadImports();
  };

  const handleCategoryChange = async (
    txId: string,
    categoryId: string,
    importId: string
  ) => {
    await ImportService.updateTransactionCategory(txId, categoryId);

    setTransactions((prev) => ({
      ...prev,
      [importId]: prev[importId].map((tx) =>
        tx._id === txId ? { ...tx, categoryId } : tx
      ),
    }));
  };

  useEffect(() => {
    loadImports();
  }, [refreshFlag]);

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead />
          <TableHead>File</TableHead>
          <TableHead>Account</TableHead>
          <TableHead>Import date</TableHead>
          <TableHead>Imported</TableHead>
          <TableHead />
        </TableRow>
      </TableHeader>

      <TableBody>
        {imports.map((imp) => (
          <Fragment key={imp._id}>
            <TableRow>
              <TableCell>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => toggleExpand(imp._id)}
                >
                  <ChevronDown
                    className={`transition ${expanded === imp._id ? "rotate-180" : ""
                      }`}
                  />
                </Button>
              </TableCell>

              <TableCell>{imp.fileName}</TableCell>
              <TableCell>{getAccountName(imp.accountId)}</TableCell>
              <TableCell>
                {new Date(imp.uploadDate).toLocaleDateString()}
              </TableCell>
              <TableCell>
                {imp.importedCount} / {imp.rowCount}
              </TableCell>

              <TableCell>
                <Button
                  size="icon"
                  variant="destructive"
                  onClick={() => handleDelete(imp._id)}
                >
                  <Trash2 size={16} />
                </Button>
              </TableCell>
            </TableRow>

            {expanded === imp._id && transactions[imp._id] && (
              <TableRow>
                <TableCell colSpan={6} className="bg-muted/30">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Category</TableHead>
                      </TableRow>
                    </TableHeader>

                    <TableBody>
                      {transactions[imp._id].map((tx) => {
                        const availableCategories = categories.filter(
                          (cat) => cat.type === tx.type
                        );

                        return (
                          <TableRow key={tx._id}>
                            <TableCell>
                              {new Date(tx.date).toLocaleDateString()}
                            </TableCell>

                            <TableCell>{tx.description}</TableCell>

                            <TableCell
                              className={
                                tx.type === "expense" ? "text-red-600" : "text-green-600"
                              }
                            >
                              {tx.type === "expense" ? "-" : "+"}
                              {formatCurrency(
                                tx.amount,
                                accounts.find((a) => a._id === imp.accountId)?.currency || ""
                              )}
                            </TableCell>

                            <TableCell>
                              <Select
                                value={tx.categoryId ?? ""}
                                onValueChange={(val) =>
                                  handleCategoryChange(tx._id, val, imp._id)
                                }
                              >
                                <SelectTrigger className="w-[200px]">
                                  <SelectValue placeholder="Select category" />
                                </SelectTrigger>

                                <SelectContent>
                                  {availableCategories.map((cat) => (
                                    <SelectItem key={cat._id} value={cat._id}>
                                      {cat.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableCell>
              </TableRow>
            )}
          </Fragment>
        ))}
      </TableBody>
    </Table>
  );
}
