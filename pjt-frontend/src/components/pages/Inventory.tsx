import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ProductForm } from "@/components/custom/ProductForm";
import { ProductTable } from "@/components/custom/ProductTable";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InventoryMovementTable } from "@/components/custom/InventoryMovementTable";

export default function Inventory() {
  const [open, setOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-[#1A1A1A]">Estoque</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>+ Novo produto</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Novo produto</DialogTitle>
            </DialogHeader>
            <ProductForm onSuccess={() => setOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="products">
        <TabsList>
          <TabsTrigger value="products">Produtos</TabsTrigger>
          <TabsTrigger value="movements">Movimentações</TabsTrigger>
        </TabsList>
        <TabsContent value="products" className="mt-4">
          <ProductTable />
        </TabsContent>
        <TabsContent value="movements" className="mt-4">
          <InventoryMovementTable />
        </TabsContent>
      </Tabs>
    </div>
  );
}