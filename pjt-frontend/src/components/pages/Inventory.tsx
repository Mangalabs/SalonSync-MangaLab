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
import { StockMovementForm } from "@/components/custom/StockMovementForm";
import { Package, TrendingUp } from "lucide-react";

export default function Inventory() {
  const [productOpen, setProductOpen] = useState(false);
  const [movementOpen, setMovementOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-[#1A1A1A]">Estoque</h1>
        <div className="flex gap-2">
          <Dialog open={movementOpen} onOpenChange={setMovementOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="border-[#D4AF37]/20 hover:bg-[#D4AF37]/10">
                <TrendingUp className="h-4 w-4 mr-2" />
                Nova Movimentação
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Registrar Movimentação</DialogTitle>
              </DialogHeader>
              <StockMovementForm onSuccess={() => setMovementOpen(false)} />
            </DialogContent>
          </Dialog>
          
          <Dialog open={productOpen} onOpenChange={setProductOpen}>
            <DialogTrigger asChild>
              <Button>
                <Package className="h-4 w-4 mr-2" />
                Novo Produto
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Novo produto</DialogTitle>
              </DialogHeader>
              <ProductForm onSuccess={() => setProductOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>
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