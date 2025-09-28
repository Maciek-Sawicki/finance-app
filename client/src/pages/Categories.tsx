import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CategoriesTable } from "@/components/Categories/CategoriesTable"
import {Card} from "@/components/ui/card"
import { CreateCategoryDialog } from "@/components/Categories/CreateCategoryDialog";
import { CategoriesService } from "@/services/categories";


export default function Categories() {
  const [createOpen, setCreateOpen] = useState(false);
  const [refreshSignal, setRefreshSignal] = useState(0);

  const triggerRefresh = () => setRefreshSignal(prev => prev + 1);

  return (
    <div className="w-full h-full flex-col justify-center items-center p-10">
      <div className="flex justify-end mb-4">
        <Button onClick={() => setCreateOpen(true)}>+ Add Category</Button>
      </div>
    <Card>
      <CategoriesTable refreshSignal={refreshSignal}/>  
    </Card>
    <CreateCategoryDialog
          open={createOpen}
          onClose={() => setCreateOpen(false)}
          onSave={async (data) => {
            await CategoriesService.create(data);
            setCreateOpen(false);
            triggerRefresh();
          }}
        />
    </div>
  )
}