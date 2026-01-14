
import os

file_path = r'c:\Users\phila\academe-portal-2025\src\pages\admin\ContentManagement.tsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Define the start and end of the component to replace
start_marker = "  // Pricing Plan Edit Dialog"
end_marker = "  // Navigation Edit Dialog"

start_idx = content.find(start_marker)
end_idx = content.find(end_marker)

if start_idx == -1 or end_idx == -1:
    print("Could not find start or end markers")
    print(f"Start: {start_idx}, End: {end_idx}")
    exit(1)

# The new content for PricingPlanEditDialog
new_content = """  // Pricing Plan Edit Dialog
  const PricingPlanEditDialog = () => (
    <Dialog open={!!editingPricingPlan} onOpenChange={() => setEditingPricingPlan(null)}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editingPricingPlan?.id ? 'Edit' : 'Add'} Pricing Plan</DialogTitle>
        </DialogHeader>
        {editingPricingPlan && (
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Name</Label>
                <Input value={editingPricingPlan.name} onChange={e => setEditingPricingPlan({ ...editingPricingPlan, name: e.target.value })} />
              </div>
              <div>
                <Label>Price</Label>
                <Input value={editingPricingPlan.price} onChange={e => setEditingPricingPlan({ ...editingPricingPlan, price: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Period</Label>
                <Input value={editingPricingPlan.period} onChange={e => setEditingPricingPlan({ ...editingPricingPlan, period: e.target.value })} />
              </div>
              <div>
                <Label>Order</Label>
                <Input type="number" value={editingPricingPlan.order || 0} onChange={e => setEditingPricingPlan({ ...editingPricingPlan, order: parseInt(e.target.value) || 0 })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
               <div>
                <Label>Color (Hex/Class)</Label>
                <Input value={editingPricingPlan.color} onChange={e => setEditingPricingPlan({ ...editingPricingPlan, color: e.target.value })} placeholder="bg-blue-500" />
              </div>
              <div>
                <Label>Icon Name</Label>
                <Input value={editingPricingPlan.icon} onChange={e => setEditingPricingPlan({ ...editingPricingPlan, icon: e.target.value })} placeholder="Star" />
              </div>
            </div>
             <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="flex items-center gap-2">
                  <Switch checked={editingPricingPlan.popular} onCheckedChange={checked => setEditingPricingPlan({ ...editingPricingPlan, popular: checked })} />
                  <Label>Popular Choice</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={editingPricingPlan.isActive} onCheckedChange={checked => setEditingPricingPlan({ ...editingPricingPlan, isActive: checked })} />
                  <Label>Active</Label>
                </div>
            </div>
            <div>
              <Label>Features (comma separated)</Label>
              <Textarea 
                value={editingPricingPlan.features.join(', ')} 
                onChange={e => setEditingPricingPlan({ ...editingPricingPlan, features: e.target.value.split(',').map(s => s.trim()) })} 
                placeholder="Feature 1, Feature 2"
              />
            </div>
            <div>
              <Label>Not Included Features (comma separated)</Label>
              <Textarea 
                value={editingPricingPlan.notIncluded?.join(', ')} 
                onChange={e => setEditingPricingPlan({ ...editingPricingPlan, notIncluded: e.target.value.split(',').map(s => s.trim()) })} 
                placeholder="Missing Feature 1, Missing Feature 2"
              />
            </div>
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => setEditingPricingPlan(null)}>Cancel</Button>
          <Button onClick={() => editingPricingPlan && savePricingPlan(editingPricingPlan)}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )

"""

# Replace the content
final_content = content[:start_idx] + new_content + content[end_idx:]

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(final_content)

print("Successfully updated PricingPlanEditDialog")
