import { useState } from 'react';
import { useToast } from "@/components/ui/use-toast";
import { AlertCircle, Info } from "lucide-react";
import { 
  Card,
  CardContent,
  CardHeader,
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const AdminUpdates = () => {
  const [updates, setUpdates] = useState([]);
  const [newUpdate, setNewUpdate] = useState("");
  const [updateType, setUpdateType] = useState("info"); // "info" or "warning"
  const { toast } = useToast();

  const handleUpdateSubmit = () => {
    if (newUpdate.trim()) {
      const update = {
        id: Date.now(),
        content: newUpdate,
        type: updateType,
        timestamp: new Date().toISOString(),
      };
      
      setUpdates([update, ...updates]);
      setNewUpdate("");
      
      toast({
        title: "Update Posted",
        description: "Your update has been successfully published.",
      });
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4 space-y-6">
      {/* Admin Input Section */}
      <Card>
        <CardHeader>
          <CardTitle>Post Admin Update</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Select
              value={updateType}
              onValueChange={setUpdateType}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select update type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="info">Information</SelectItem>
                <SelectItem value="warning">Warning</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Textarea
            placeholder="Enter your update message..."
            value={newUpdate}
            onChange={(e) => setNewUpdate(e.target.value)}
            className="min-h-[100px]"
          />
          <Button onClick={handleUpdateSubmit}>
            Post Update
          </Button>
        </CardContent>
      </Card>

      {/* Updates Display */}
      <div className="space-y-4">
        {updates.map((update) => (
          <Card
            key={update.id}
            className={`${
              update.type === "warning"
                ? "border-red-500 bg-red-50"
                : "border-blue-500 bg-blue-50"
            }`}
          >
            <CardContent className="p-4">
              <div className="flex items-start space-x-3">
                {update.type === "warning" ? (
                  <AlertCircle className="h-5 w-5 text-red-500 mt-1" />
                ) : (
                  <Info className="h-5 w-5 text-blue-500 mt-1" />
                )}
                <div className="space-y-1">
                  <p className={`text-sm ${
                    update.type === "warning" ? "text-red-700" : "text-blue-700"
                  }`}>
                    {update.content}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(update.timestamp).toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default AdminUpdates;