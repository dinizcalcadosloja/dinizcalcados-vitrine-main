import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type Props = {
  open: boolean;
  onContinue: () => void;
  onLogout: () => void;
};

export function InactivityWarningDialog({ open, onContinue, onLogout }: Props) {
  return (
    <AlertDialog open={open}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Sessão prestes a expirar</AlertDialogTitle>
          <AlertDialogDescription>
            Sua sessão expirará em 1 minuto por inatividade.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onLogout}>Sair agora</AlertDialogCancel>
          <AlertDialogAction onClick={onContinue}>Continuar sessão</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
