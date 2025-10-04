// "use client";

// import { useState, useEffect } from "react";
// import {
//   Dialog,
//   DialogContent,
//   DialogDescription,
//   DialogHeader,
//   DialogTitle,
//   DialogFooter,
// } from "@/components/ui/dialog";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select";
// import * as Tabs from "@radix-ui/react-tabs";
// import type { Account, Category } from "@/lib/types";
// import { RatesService } from "@/services/rates";
// import { TransactionsService } from "@/services/transactions";

// type CreateTransactionDialogProps = {
//   open: boolean;
//   onClose: () => void;
//   onSave: (data: any) => Promise<void>;
//   accounts: Account[];
//   categories: Category[];
// };

// export const CreateTransactionDialog = ({
//   open,
//   onClose,
//   onSave,
//   accounts,
//   categories,
// }: CreateTransactionDialogProps) => {
//   const [tab, setTab] = useState<"income" | "expense" | "transfer">("income");

//   const [form, setForm] = useState<any>({
//     accountId: "",
//     categoryId: "",
//     fromAccountId: "",
//     toAccountId: "",
//     amount: "",
//     toAmount: "",
//     customToAmount: "",
//     description: "",
//     date: new Date().toISOString().slice(0, 16),
//   });

//   const [exchangeRate, setExchangeRate] = useState<number | null>(null);

//   const handleChange = (field: string, value: string | number) => {
//     setForm((prev: any) => ({ ...prev, [field]: value }));
//   };

//   // 🔹 Liczenie toAmount w transferze po kursie
//   useEffect(() => {
//     const calculateToAmount = async () => {
//       if (
//         tab !== "transfer" ||
//         !form.amount ||
//         !form.fromAccountId ||
//         !form.toAccountId
//       ) {
//         handleChange("toAmount", "");
//         setExchangeRate(null);
//         return;
//       }

//       const fromAcc = accounts.find((a) => a._id === form.fromAccountId);
//       const toAcc = accounts.find((a) => a._id === form.toAccountId);
//       if (!fromAcc || !toAcc) return;

//       try {
//         const rate = await RatesService.getExchangeRate(fromAcc.currency, toAcc.currency);
//         const toAmount = parseFloat(form.amount) * rate;
//         handleChange("toAmount", toAmount.toFixed(2));
//         setExchangeRate(rate);
//       } catch (err) {
//         console.error("Error calculating exchange:", err);
//         handleChange("toAmount", form.amount);
//         setExchangeRate(1);
//       }
//     };

//     calculateToAmount();
//   }, [form.amount, form.fromAccountId, form.toAccountId, tab, accounts]);

//   const isValid = () => {
//     if (tab === "transfer") return form.fromAccountId && form.toAccountId && form.amount;
//     return form.accountId && form.amount && (tab === "income" || tab === "expense" ? form.categoryId : true);
//   };

//   const handleSubmit = async () => {
//     if (!isValid()) return;

//     if (tab === "transfer") {
//       const payload = {
//         fromAccountId: form.fromAccountId,
//         toAccountId: form.toAccountId,
//         amount: parseFloat(form.amount),
//         toAmount: form.customToAmount
//           ? parseFloat(form.customToAmount)
//           : form.toAmount
//           ? parseFloat(form.toAmount)
//           : 0,
//         description: form.description,
//         date: new Date(form.date).toISOString(),
//       };

//       await TransactionsService.createTransfer(payload);
//     } else {
//       const payload = {
//         accountId: form.accountId,
//         categoryId: tab !== "income" && tab !== "expense" ? undefined : form.categoryId,
//         amount: parseFloat(form.amount),
//         description: form.description,
//         date: new Date(form.date).toISOString(),
//         type: tab, // income / expense
//       };

//       await TransactionsService.create(payload);
//     }

//     onClose();
//     setForm({
//       accountId: "",
//       categoryId: "",
//       fromAccountId: "",
//       toAccountId: "",
//       amount: "",
//       toAmount: "",
//       customToAmount: "",
//       description: "",
//       date: new Date().toISOString().slice(0, 16),
//     });
//     setExchangeRate(null);
//   };

//   const renderAccountSelect = (field: string, value: string) => (
//     <Select value={value} onValueChange={(val) => handleChange(field, val)}>
//       <SelectTrigger>
//         <SelectValue placeholder="Select account" />
//       </SelectTrigger>
//       <SelectContent>
//         {accounts.map((acc) => (
//           <SelectItem key={acc._id} value={acc._id}>
//             {acc.name} ({acc.currency})
//           </SelectItem>
//         ))}
//       </SelectContent>
//     </Select>
//   );

//   return (
//     <Dialog open={open} onOpenChange={onClose}>
//       <DialogContent className="max-w-lg">
//         <DialogHeader>
//           <DialogTitle>Create Transaction</DialogTitle>
//           <DialogDescription>
//             Choose transaction type and fill in details.
//           </DialogDescription>
//         </DialogHeader>

//         <Tabs.Root value={tab} onValueChange={(val) => setTab(val as any)}>
//           <Tabs.List className="grid grid-cols-3 gap-2 mb-4">
//             {["income", "expense", "transfer"].map((t) => (
//               <Tabs.Trigger
//                 key={t}
//                 value={t}
//                 className={`p-2 rounded ${tab === t ? "bg-primary text-white" : "bg-muted"}`}
//               >
//                 {t.charAt(0).toUpperCase() + t.slice(1)}
//               </Tabs.Trigger>
//             ))}
//           </Tabs.List>

//           {/* Content sections */}
//           {["income", "expense"].map((type) => (
//             <Tabs.Content key={type} value={type} className="space-y-4">
//               <div>
//                 <Label>Account</Label>
//                 {renderAccountSelect("accountId", form.accountId)}
//               </div>
//               <div>
//                 <Label>Category</Label>
//                 <Select
//                   value={form.categoryId}
//                   onValueChange={(val) => handleChange("categoryId", val)}
//                 >
//                   <SelectTrigger>
//                     <SelectValue placeholder="Select category" />
//                   </SelectTrigger>
//                   <SelectContent>
//                     {categories.filter((c) => c.type === type).map((c) => (
//                       <SelectItem key={c._id} value={c._id}>
//                         {c.name}
//                       </SelectItem>
//                     ))}
//                   </SelectContent>
//                 </Select>
//               </div>
//               <div>
//                 <Label>Amount</Label>
//                 <Input
//                   type="number"
//                   value={form.amount}
//                   onChange={(e) => handleChange("amount", e.target.value)}
//                 />
//               </div>
//               <div>
//                 <Label>Date</Label>
//                 <Input
//                   type="datetime-local"
//                   value={form.date}
//                   onChange={(e) => handleChange("date", e.target.value)}
//                 />
//               </div>
//               <div>
//                 <Label>Description</Label>
//                 <Input
//                   value={form.description}
//                   onChange={(e) => handleChange("description", e.target.value)}
//                 />
//               </div>
//             </Tabs.Content>
//           ))}

//           {/* Transfer */}
//           <Tabs.Content value="transfer" className="space-y-4">
//             <div>
//               <Label>From Account</Label>
//               {renderAccountSelect("fromAccountId", form.fromAccountId)}
//             </div>
//             <div>
//               <Label>To Account</Label>
//               {renderAccountSelect("toAccountId", form.toAccountId)}
//             </div>
//             <div>
//               <Label>Amount</Label>
//               <Input
//                 type="number"
//                 value={form.amount}
//                 onChange={(e) => handleChange("amount", e.target.value)}
//               />
//             </div>
//             {exchangeRate && (
//               <div className="text-sm text-muted-foreground">
//                 Exchange rate: {exchangeRate.toFixed(4)}
//               </div>
//             )}
//             <div>
//               <Label>To Amount (calculated)</Label>
//               <Input type="number" value={form.toAmount} readOnly />
//             </div>
//             <div>
//               <Label>Custom To Amount</Label>
//               <Input
//                 type="number"
//                 placeholder="Optional"
//                 value={form.customToAmount}
//                 onChange={(e) => handleChange("customToAmount", e.target.value)}
//               />
//             </div>
//             <div>
//               <Label>Date</Label>
//               <Input
//                 type="datetime-local"
//                 value={form.date}
//                 onChange={(e) => handleChange("date", e.target.value)}
//               />
//             </div>
//             <div>
//               <Label>Description</Label>
//               <Input
//                 value={form.description}
//                 onChange={(e) => handleChange("description", e.target.value)}
//               />
//             </div>
//           </Tabs.Content>
//         </Tabs.Root>

//         <DialogFooter>
//           <Button variant="outline" onClick={onClose}>
//             Cancel
//           </Button>
//           <Button onClick={handleSubmit} disabled={!isValid()}>
//             Create
//           </Button>
//         </DialogFooter>
//       </DialogContent>
//     </Dialog>
//   );
// };

// "use client";

// import { useState, useEffect } from "react";
// import {
//   Dialog,
//   DialogContent,
//   DialogDescription,
//   DialogHeader,
//   DialogTitle,
//   DialogFooter,
// } from "@/components/ui/dialog";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select";
// import * as Tabs from "@radix-ui/react-tabs";
// import type { Account, Category } from "@/lib/types";
// import { RatesService } from "@/services/rates";
// import { TransactionsService } from "@/services/transactions";

// type CreateTransactionDialogProps = {
//   open: boolean;
//   onClose: () => void;
//   onSave: () => Promise<void>; // funkcja do reloadu tabeli
//   accounts: Account[];
//   categories: Category[];
// };

// export const CreateTransactionDialog = ({
//   open,
//   onClose,
//   onSave,
//   accounts,
//   categories,
// }: CreateTransactionDialogProps) => {
//   const [tab, setTab] = useState<"income" | "expense" | "transfer" | "exclude">("income");

//   const [form, setForm] = useState<any>({
//     accountId: "",
//     categoryId: "",
//     fromAccountId: "",
//     toAccountId: "",
//     amount: "",
//     toAmount: "",
//     customToAmount: "",
//     description: "",
//     date: new Date().toISOString().slice(0, 16),
//   });

//   const [exchangeRate, setExchangeRate] = useState<number | null>(null);

//   const handleChange = (field: string, value: string | number) => {
//     setForm((prev: any) => ({ ...prev, [field]: value }));
//   };

//   // 🔹 Liczenie toAmount w transferze po kursie
//   useEffect(() => {
//     const calculateToAmount = async () => {
//       if (
//         tab !== "transfer" ||
//         !form.amount ||
//         !form.fromAccountId ||
//         !form.toAccountId
//       ) {
//         handleChange("toAmount", "");
//         setExchangeRate(null);
//         return;
//       }

//       const fromAcc = accounts.find((a) => a._id === form.fromAccountId);
//       const toAcc = accounts.find((a) => a._id === form.toAccountId);
//       if (!fromAcc || !toAcc) return;

//       try {
//         const rate = await RatesService.getExchangeRate(fromAcc.currency, toAcc.currency);
//         const toAmount = parseFloat(form.amount) * rate;
//         handleChange("toAmount", toAmount.toFixed(2));
//         setExchangeRate(rate);
//       } catch (err) {
//         console.error("Error calculating exchange:", err);
//         handleChange("toAmount", form.amount);
//         setExchangeRate(1);
//       }
//     };

//     calculateToAmount();
//   }, [form.amount, form.fromAccountId, form.toAccountId, tab, accounts]);

//   const isValid = () => {
//     if (tab === "transfer")
//       return form.fromAccountId && form.toAccountId && form.amount;
//     return form.accountId && form.amount;
//   };

//   const handleSubmit = async () => {
//     if (!isValid()) return;

//     try {
//       if (tab === "transfer") {
//         const payload = {
//           fromAccountId: form.fromAccountId,
//           toAccountId: form.toAccountId,
//           amount: parseFloat(form.amount),
//           toAmount: form.customToAmount
//             ? parseFloat(form.customToAmount)
//             : form.toAmount
//             ? parseFloat(form.toAmount)
//             : 0,
//           description: form.description,
//           date: new Date(form.date).toISOString(),
//         };
//         await TransactionsService.createTransfer(payload);
//       } else {
//         const payload = {
//           accountId: form.accountId,
//           categoryId: tab !== "exclude" ? form.categoryId : undefined,
//           amount: parseFloat(form.amount),
//           description: form.description,
//           date: new Date(form.date).toISOString(),
//           type: tab, // income / expense / exclude
//         };
//         await TransactionsService.create(payload);
//       }

//       await onSave(); // reload tabeli
//       onClose();

//       // reset form
//       setForm({
//         accountId: "",
//         categoryId: "",
//         fromAccountId: "",
//         toAccountId: "",
//         amount: "",
//         toAmount: "",
//         customToAmount: "",
//         description: "",
//         date: new Date().toISOString().slice(0, 16),
//       });
//       setExchangeRate(null);
//     } catch (err) {
//       console.error("Error creating transaction:", err);
//     }
//   };

//   const renderAccountSelect = (field: string, value: string) => (
//     <Select value={value} onValueChange={(val) => handleChange(field, val)}>
//       <SelectTrigger>
//         <SelectValue placeholder="Select account" />
//       </SelectTrigger>
//       <SelectContent>
//         {accounts.map((acc) => (
//           <SelectItem key={acc._id} value={acc._id}>
//             {acc.name} ({acc.currency})
//           </SelectItem>
//         ))}
//       </SelectContent>
//     </Select>
//   );

//   return (
//     <Dialog open={open} onOpenChange={onClose}>
//       <DialogContent className="max-w-lg">
//         <DialogHeader>
//           <DialogTitle>Create Transaction</DialogTitle>
//           <DialogDescription>
//             Choose transaction type and fill in details.
//           </DialogDescription>
//         </DialogHeader>

//         <Tabs.Root value={tab} onValueChange={(val) => setTab(val as any)}>
//           <Tabs.List className="grid grid-cols-4 gap-2 mb-4">
//             {["income", "expense", "transfer", "exclude"].map((t) => (
//               <Tabs.Trigger
//                 key={t}
//                 value={t}
//                 className={`p-2 rounded ${tab === t ? "bg-primary text-white" : "bg-muted"}`}
//               >
//                 {t.charAt(0).toUpperCase() + t.slice(1)}
//               </Tabs.Trigger>
//             ))}
//           </Tabs.List>

//           {["income", "expense", "transfer", "exclude"].map((type) => (
//             <Tabs.Content key={type} value={type} className="space-y-4">
//               {type !== "transfer" && (
//                 <>
//                   <div>
//                     <Label>Account</Label>
//                     {renderAccountSelect("accountId", form.accountId)}
//                   </div>
//                   {type !== "exclude" && (
//                     <div>
//                       <Label>Category</Label>
//                       <Select
//                         value={form.categoryId}
//                         onValueChange={(val) => handleChange("categoryId", val)}
//                       >
//                         <SelectTrigger>
//                           <SelectValue placeholder="Select category" />
//                         </SelectTrigger>
//                         <SelectContent>
//                           {categories
//                             .filter((c) => c.type === type)
//                             .map((c) => (
//                               <SelectItem key={c._id} value={c._id}>
//                                 {c.name}
//                               </SelectItem>
//                             ))}
//                         </SelectContent>
//                       </Select>
//                     </div>
//                   )}
//                   <div>
//                     <Label>Amount</Label>
//                     <Input
//                       type="number"
//                       value={form.amount}
//                       onChange={(e) => handleChange("amount", e.target.value)}
//                     />
//                   </div>
//                   <div>
//                     <Label>Date</Label>
//                     <Input
//                       type="datetime-local"
//                       value={form.date}
//                       onChange={(e) => handleChange("date", e.target.value)}
//                     />
//                   </div>
//                   <div>
//                     <Label>Description</Label>
//                     <Input
//                       value={form.description}
//                       onChange={(e) => handleChange("description", e.target.value)}
//                     />
//                   </div>
//                 </>
//               )}

//               {type === "transfer" && (
//                 <>
//                   <div>
//                     <Label>From Account</Label>
//                     {renderAccountSelect("fromAccountId", form.fromAccountId)}
//                   </div>
//                   <div>
//                     <Label>To Account</Label>
//                     {renderAccountSelect("toAccountId", form.toAccountId)}
//                   </div>
//                   <div>
//                     <Label>Amount</Label>
//                     <Input
//                       type="number"
//                       value={form.amount}
//                       onChange={(e) => handleChange("amount", e.target.value)}
//                     />
//                   </div>
//                   {exchangeRate && (
//                     <div className="text-sm text-muted-foreground">
//                       Exchange rate: {exchangeRate.toFixed(4)}
//                     </div>
//                   )}
//                   <div>
//                     <Label>To Amount</Label>
//                     <Input type="number" value={form.toAmount} readOnly />
//                   </div>
//                   <div>
//                     <Label>Custom To Amount (optional)</Label>
//                     <Input
//                       type="number"
//                       value={form.customToAmount}
//                       onChange={(e) => handleChange("customToAmount", e.target.value)}
//                     />
//                   </div>
//                   <div>
//                     <Label>Date</Label>
//                     <Input
//                       type="datetime-local"
//                       value={form.date}
//                       onChange={(e) => handleChange("date", e.target.value)}
//                     />
//                   </div>
//                   <div>
//                     <Label>Description</Label>
//                     <Input
//                       value={form.description}
//                       onChange={(e) => handleChange("description", e.target.value)}
//                     />
//                   </div>
//                 </>
//               )}
//             </Tabs.Content>
//           ))}
//         </Tabs.Root>

//         <DialogFooter>
//           <Button variant="outline" onClick={onClose}>
//             Cancel
//           </Button>
//           <Button onClick={handleSubmit} disabled={!isValid()}>
//             Create
//           </Button>
//         </DialogFooter>
//       </DialogContent>
//     </Dialog>
//   );
// };

"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import * as Tabs from "@radix-ui/react-tabs";
import type { Account, Category } from "@/lib/types";
import { RatesService } from "@/services/rates";

type CreateTransactionDialogProps = {
  open: boolean;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
  accounts: Account[];
  categories: Category[];
};

export const CreateTransactionDialog = ({
  open,
  onClose,
  onSave,
  accounts,
  categories,
}: CreateTransactionDialogProps) => {
  const [tab, setTab] = useState<"income" | "expense" | "transfer" | "exclude">("income");

  const [form, setForm] = useState<any>({
    accountId: "",
    categoryId: "",
    fromAccountId: "",
    toAccountId: "",
    amount: "",
    toAmount: "",
    customToAmount: "",
    description: "",
    date: new Date().toISOString().slice(0, 16),
  });

  const [exchangeRate, setExchangeRate] = useState<number | null>(null);

  const handleChange = (field: string, value: string | number) => {
    setForm((prev: any) => ({ ...prev, [field]: value }));
  };

  // 🔹 Liczenie toAmount w transferze po kursie
  useEffect(() => {
    const calculateToAmount = async () => {
      if (
        tab !== "transfer" ||
        !form.amount ||
        !form.fromAccountId ||
        !form.toAccountId
      ) {
        handleChange("toAmount", "");
        setExchangeRate(null);
        return;
      }

      const fromAcc = accounts.find((a) => a._id === form.fromAccountId);
      const toAcc = accounts.find((a) => a._id === form.toAccountId);
      if (!fromAcc || !toAcc) return;

      try {
        const rate = await RatesService.getExchangeRate(fromAcc.currency, toAcc.currency);
        const toAmount = parseFloat(form.amount) * rate;
        handleChange("toAmount", toAmount.toFixed(2));
        setExchangeRate(rate);
      } catch (err) {
        console.error("Error calculating exchange:", err);
        handleChange("toAmount", form.amount);
        setExchangeRate(1);
      }
    };

    calculateToAmount();
  }, [form.amount, form.fromAccountId, form.toAccountId, tab, accounts]);

  const isValid = () => {
    if (tab === "transfer")
      return form.fromAccountId && form.toAccountId && form.amount;
    return form.accountId && form.amount && (tab === "exclude" || form.categoryId);
  };

  const handleSubmit = async () => {
    if (!isValid()) return;

    let payload: any = {};
    if (tab === "transfer") {
      payload = {
        fromAccountId: form.fromAccountId,
        toAccountId: form.toAccountId,
        amount: parseFloat(form.amount),
        toAmount: form.customToAmount ? parseFloat(form.customToAmount) : parseFloat(form.toAmount),
        description: form.description,
        date: new Date(form.date).toISOString(),
        type: "transfer",
      };
    } else {
      payload = {
        accountId: form.accountId,
        categoryId: tab === "exclude" ? undefined : form.categoryId,
        amount: parseFloat(form.amount),
        description: form.description,
        date: new Date(form.date).toISOString(),
        type: tab,
      };
    }

    await onSave(payload);
    onClose();
    setForm({
      accountId: "",
      categoryId: "",
      fromAccountId: "",
      toAccountId: "",
      amount: "",
      toAmount: "",
      customToAmount: "",
      description: "",
      date: new Date().toISOString().slice(0, 16),
    });
    setExchangeRate(null);
  };

  const renderAccountSelect = (field: string, value: string) => (
    <Select value={value} onValueChange={(val) => handleChange(field, val)}>
      <SelectTrigger>
        <SelectValue placeholder="Select account" />
      </SelectTrigger>
      <SelectContent>
        {accounts.map((acc) => (
          <SelectItem key={acc._id} value={acc._id}>
            {acc.name} ({acc.currency})
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Create Transaction</DialogTitle>
          <DialogDescription>
            Choose transaction type and fill in details.
          </DialogDescription>
        </DialogHeader>

        <Tabs.Root value={tab} onValueChange={(val) => setTab(val as any)}>
          <Tabs.List className="grid grid-cols-4 gap-2 mb-4">
            {["income", "expense", "transfer", "exclude"].map((t) => (
              <Tabs.Trigger
                key={t}
                value={t}
                className={`p-2 rounded ${
                  tab === t ? "bg-primary text-white" : "bg-muted"
                }`}
              >
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </Tabs.Trigger>
            ))}
          </Tabs.List>

          {/* Content sections */}
          {["income", "expense", "transfer", "exclude"].map((type) => (
            <Tabs.Content key={type} value={type} className="space-y-4">
              {(type === "income" || type === "expense" || type === "exclude") && (
                <>
                  <div>
                    <Label>Account</Label>
                    {renderAccountSelect("accountId", form.accountId)}
                  </div>
                  {type !== "exclude" && (
                    <div>
                      <Label>Category</Label>
                      <Select
                        value={form.categoryId}
                        onValueChange={(val) => handleChange("categoryId", val)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories
                            .filter((c) => c.type === type)
                            .map((c) => (
                              <SelectItem key={c._id} value={c._id}>
                                {c.name}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  <div>
                    <Label>Amount</Label>
                    <Input
                      type="number"
                      value={form.amount}
                      onChange={(e) => handleChange("amount", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Date</Label>
                    <Input
                      type="datetime-local"
                      value={form.date}
                      onChange={(e) => handleChange("date", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Description</Label>
                    <Input
                      value={form.description}
                      onChange={(e) => handleChange("description", e.target.value)}
                    />
                  </div>
                </>
              )}

              {type === "transfer" && (
                <>
                  <div>
                    <Label>From Account</Label>
                    {renderAccountSelect("fromAccountId", form.fromAccountId)}
                  </div>
                  <div>
                    <Label>To Account</Label>
                    {renderAccountSelect("toAccountId", form.toAccountId)}
                  </div>
                  <div>
                    <Label>Amount</Label>
                    <Input
                      type="number"
                      value={form.amount}
                      onChange={(e) => handleChange("amount", e.target.value)}
                    />
                  </div>
                  {exchangeRate && (
                    <div className="text-sm text-muted-foreground">
                      Exchange rate: {exchangeRate.toFixed(4)}
                    </div>
                  )}
                  <div>
                    <Label>Calculated To Amount</Label>
                    <Input type="number" value={form.toAmount} readOnly />
                  </div>
                  <div>
                    <Label>Custom To Amount (optional)</Label>
                    <Input
                      type="number"
                      value={form.customToAmount}
                      onChange={(e) => handleChange("customToAmount", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Date</Label>
                    <Input
                      type="datetime-local"
                      value={form.date}
                      onChange={(e) => handleChange("date", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Description</Label>
                    <Input
                      value={form.description}
                      onChange={(e) => handleChange("description", e.target.value)}
                    />
                  </div>
                </>
              )}
            </Tabs.Content>
          ))}
        </Tabs.Root>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!isValid()}>
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};



