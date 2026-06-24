import { useState } from "react";
import {
  useGetAuthorizedUsers,
  useRemoveAuthorizedUser,
  useAddAuthorizedUser,
  getGetAuthorizedUsersQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Users as UsersIcon, UserPlus, Trash2, ShieldCheck, UserX } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";

const MASTER_ID = 7898178629;

export default function Users() {
  const { data: users, isLoading } = useGetAuthorizedUsers();
  const removeUser = useRemoveAuthorizedUser();
  const addUser = useAddAuthorizedUser();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [newTelegramId, setNewTelegramId] = useState("");
  const [newNickname, setNewNickname] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleAdd = () => {
    const telegramId = parseInt(newTelegramId, 10);
    if (!telegramId || isNaN(telegramId)) {
      toast({ title: "Invalid ID", description: "Enter a valid Telegram numeric ID.", variant: "destructive" });
      return;
    }
    addUser.mutate(
      { data: { telegramId, addedBy: MASTER_ID, isActive: true, nickname: newNickname || undefined } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetAuthorizedUsersQueryKey() });
          toast({ title: "Agent Inducted", description: `Telegram ID ${telegramId} added to Shadow Garden.` });
          setNewTelegramId("");
          setNewNickname("");
          setDialogOpen(false);
        },
        onError: () => {
          toast({ title: "Induction Failed", description: "Could not add the agent. Try again.", variant: "destructive" });
        },
      }
    );
  };

  const handleRemove = (id: number, displayName: string) => {
    removeUser.mutate(
      { id },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetAuthorizedUsersQueryKey() });
          toast({ title: "Agent Expelled", description: `${displayName} has been removed from Shadow Garden.` });
        },
        onError: () => {
          toast({ title: "Expulsion Failed", description: "Could not remove the agent.", variant: "destructive" });
        },
      }
    );
  };

  return (
    <div className="space-y-6">
      <header className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-4xl font-serif font-bold bg-gradient-to-r from-white to-primary bg-clip-text text-transparent inline-block">
            Shadow Garden Members
          </h1>
          <p className="text-muted-foreground mt-2 font-mono text-sm uppercase tracking-widest">
            Authorized Agents Registry
          </p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button
              className="bg-primary/20 hover:bg-primary/40 border border-primary/40 text-primary font-mono shadow-[0_0_15px_-5px_hsl(var(--primary))] hover:shadow-[0_0_25px_-5px_hsl(var(--primary))] transition-all"
              data-testid="button-add-user"
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Induct Agent
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-primary/30 shadow-[0_0_60px_-10px_hsl(var(--primary)_/_0.3)]">
            <DialogHeader>
              <DialogTitle className="font-serif text-2xl text-primary">Induct a New Agent</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              <div className="space-y-2">
                <Label htmlFor="telegram-id" className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                  Telegram ID
                </Label>
                <Input
                  id="telegram-id"
                  placeholder="e.g. 123456789"
                  value={newTelegramId}
                  onChange={(e) => setNewTelegramId(e.target.value)}
                  className="bg-background/60 border-primary/30 font-mono"
                  data-testid="input-telegram-id"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nickname" className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                  Code Name (Optional)
                </Label>
                <Input
                  id="nickname"
                  placeholder="e.g. Alpha, Beta..."
                  value={newNickname}
                  onChange={(e) => setNewNickname(e.target.value)}
                  className="bg-background/60 border-primary/30 font-mono"
                  data-testid="input-nickname"
                />
              </div>
            </div>
            <DialogFooter className="mt-4">
              <DialogClose asChild>
                <Button variant="ghost" className="font-mono">Cancel</Button>
              </DialogClose>
              <Button
                onClick={handleAdd}
                disabled={addUser.isPending}
                className="bg-primary text-primary-foreground hover:bg-primary/90 font-mono"
                data-testid="button-confirm-add"
              >
                {addUser.isPending ? "Inducting..." : "Confirm Induction"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </header>

      {/* Stats bar */}
      <div className="flex gap-4">
        <Card className="border-primary/10 bg-card/40 flex-1 p-4 flex items-center gap-3">
          <ShieldCheck className="w-8 h-8 text-primary opacity-60" />
          <div>
            <p className="text-2xl font-bold">{isLoading ? "—" : users?.length ?? 0}</p>
            <p className="text-xs text-muted-foreground font-mono uppercase tracking-wider">Total Agents</p>
          </div>
        </Card>
        <Card className="border-primary/10 bg-card/40 flex-1 p-4 flex items-center gap-3">
          <UsersIcon className="w-8 h-8 text-accent opacity-60" />
          <div>
            <p className="text-2xl font-bold">{isLoading ? "—" : users?.filter((u) => u.isActive).length ?? 0}</p>
            <p className="text-xs text-muted-foreground font-mono uppercase tracking-wider">Active Agents</p>
          </div>
        </Card>
      </div>

      {/* Members Table */}
      <Card className="border-primary/10 bg-card/40 shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-serif">
            <UsersIcon className="w-5 h-5 text-primary" />
            Agent Roster
          </CardTitle>
          <CardDescription className="font-mono text-xs">All inducted members of Shadow Garden</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full rounded-lg" />
              ))}
            </div>
          ) : !users || users.length === 0 ? (
            <div className="py-16 text-center">
              <UserX className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
              <p className="text-muted-foreground font-mono text-sm">[ NO AGENTS INDUCTED ]</p>
              <p className="text-muted-foreground/60 text-xs mt-2">Shadow Garden awaits its first member.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {users.map((user) => {
                const displayName = user.nickname || user.firstName || user.username || `Agent #${user.id}`;
                const isMaster = user.telegramId === MASTER_ID;
                return (
                  <div
                    key={user.id}
                    data-testid={`row-user-${user.id}`}
                    className={`flex items-center justify-between p-4 rounded-lg border transition-all group hover:border-primary/30 ${
                      isMaster
                        ? "border-primary/40 bg-primary/5 shadow-[0_0_20px_-8px_hsl(var(--primary)_/_0.4)]"
                        : "border-border/50 bg-secondary/20 hover:bg-secondary/40"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-serif font-bold ${
                          isMaster ? "bg-primary/20 text-primary border border-primary/40" : "bg-secondary text-foreground"
                        }`}
                      >
                        {displayName[0].toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold tracking-wide" data-testid={`text-username-${user.id}`}>
                            {displayName}
                          </span>
                          {isMaster && (
                            <span className="text-[10px] font-mono text-primary border border-primary/40 px-1.5 py-0.5 rounded uppercase tracking-wider">
                              Master
                            </span>
                          )}
                          {!user.isActive && (
                            <span className="text-[10px] font-mono text-destructive border border-destructive/40 px-1.5 py-0.5 rounded uppercase tracking-wider">
                              Inactive
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-0.5">
                          <span className="text-xs text-muted-foreground font-mono" data-testid={`text-telegram-id-${user.id}`}>
                            ID: {user.telegramId}
                          </span>
                          {user.addedAt && (
                            <span className="text-xs text-muted-foreground/60 font-mono">
                              Inducted {formatDistanceToNow(new Date(user.addedAt), { addSuffix: true })}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {!isMaster && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive hover:bg-destructive/10"
                            data-testid={`button-remove-user-${user.id}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="bg-card border-destructive/30">
                          <AlertDialogHeader>
                            <AlertDialogTitle className="font-serif text-destructive">Expel Agent</AlertDialogTitle>
                            <AlertDialogDescription>
                              Remove <strong>{displayName}</strong> from Shadow Garden? This action cannot be undone without Master's approval.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel className="font-mono">Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleRemove(user.id, displayName)}
                              className="bg-destructive hover:bg-destructive/90 font-mono"
                              data-testid={`button-confirm-remove-${user.id}`}
                            >
                              Expel
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
