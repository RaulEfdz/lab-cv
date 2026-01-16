'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { updateUserProfile, changePassword, deleteAccount, signOut } from '@/app/dashboard/actions'
import { Loader2, Check, X } from 'lucide-react'

interface ProfileFormProps {
  userId: string
  initialFullName: string
  email: string
  role: 'user' | 'admin'
  createdAt: string
}

export function ProfileForm({ userId, initialFullName, email, role, createdAt }: ProfileFormProps) {
  const [fullName, setFullName] = useState(initialFullName)
  const [isUpdating, setIsUpdating] = useState(false)
  const [updateMessage, setUpdateMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Password change dialog
  const [showPasswordDialog, setShowPasswordDialog] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Delete account confirmation
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsUpdating(true)
    setUpdateMessage(null)

    const result = await updateUserProfile({ full_name: fullName })

    if (result.success) {
      setUpdateMessage({ type: 'success', text: result.message || 'Perfil actualizado' })
    } else {
      setUpdateMessage({ type: 'error', text: result.error || 'Error al actualizar' })
    }

    setIsUpdating(false)
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordMessage(null)

    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'Las contraseñas no coinciden' })
      return
    }

    setIsChangingPassword(true)
    const result = await changePassword(newPassword)

    if (result.success) {
      setPasswordMessage({ type: 'success', text: result.message || 'Contraseña actualizada' })
      setNewPassword('')
      setConfirmPassword('')
      setTimeout(() => {
        setShowPasswordDialog(false)
        setPasswordMessage(null)
      }, 2000)
    } else {
      setPasswordMessage({ type: 'error', text: result.error || 'Error al cambiar contraseña' })
    }

    setIsChangingPassword(false)
  }

  const handleDeleteAccount = async () => {
    if (deleteConfirmText.toLowerCase() !== 'eliminar') {
      return
    }
    await deleteAccount()
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  return (
    <>
      {/* Personal Information Form */}
      <form onSubmit={handleUpdateProfile} className="space-y-6">
        {/* Full Name */}
        <div>
          <Label htmlFor="fullName">Nombre completo</Label>
          <Input
            id="fullName"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Juan Pérez"
            className="mt-2"
          />
        </div>

        {/* Email (Read-only) */}
        <div>
          <Label>Email</Label>
          <Input
            value={email}
            disabled
            className="mt-2 bg-neutral-50"
          />
          <p className="text-xs text-neutral-500 mt-1">
            El email no se puede modificar
          </p>
        </div>

        {/* Role (Read-only) */}
        <div>
          <Label>Rol</Label>
          <div className="mt-2">
            <Badge variant={role === 'admin' ? 'default' : 'secondary'}>
              {role === 'admin' ? 'Administrador' : 'Usuario'}
            </Badge>
          </div>
        </div>

        {/* Created At */}
        <div>
          <Label>Miembro desde</Label>
          <p className="text-sm text-neutral-600 mt-2">
            {formatDate(createdAt)}
          </p>
        </div>

        {/* Update Message */}
        {updateMessage && (
          <div className={`flex items-center gap-2 p-3 rounded-lg ${
            updateMessage.type === 'success'
              ? 'bg-green-50 text-green-700 border border-green-200'
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            {updateMessage.type === 'success' ? (
              <Check className="w-4 h-4" />
            ) : (
              <X className="w-4 h-4" />
            )}
            <span className="text-sm">{updateMessage.text}</span>
          </div>
        )}

        {/* Update Button */}
        <div className="flex gap-3">
          <Button type="submit" disabled={isUpdating || fullName === initialFullName}>
            {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Guardar cambios
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => setFullName(initialFullName)}
            disabled={fullName === initialFullName}
          >
            Cancelar
          </Button>
        </div>
      </form>

      {/* Change Password Button */}
      <div className="mt-6 pt-6 border-t border-neutral-200">
        <Button
          type="button"
          variant="outline"
          onClick={() => setShowPasswordDialog(true)}
        >
          Cambiar contraseña
        </Button>
      </div>

      {/* Delete Account Button */}
      <div className="mt-6">
        <Button
          type="button"
          variant="destructive"
          onClick={() => setShowDeleteDialog(true)}
        >
          Eliminar cuenta
        </Button>
      </div>

      {/* Sign Out Button */}
      <div className="mt-4">
        <Button
          type="button"
          variant="ghost"
          onClick={() => signOut()}
        >
          Cerrar sesión
        </Button>
      </div>

      {/* Change Password Dialog */}
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cambiar contraseña</DialogTitle>
            <DialogDescription>
              Ingresa tu nueva contraseña. Debe tener al menos 8 caracteres,
              incluyendo mayúsculas, minúsculas y números.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleChangePassword}>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="newPassword">Nueva contraseña</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="mt-2"
                  required
                />
              </div>
              <div>
                <Label htmlFor="confirmPassword">Confirmar contraseña</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="mt-2"
                  required
                />
              </div>
              {passwordMessage && (
                <div className={`flex items-center gap-2 p-3 rounded-lg ${
                  passwordMessage.type === 'success'
                    ? 'bg-green-50 text-green-700 border border-green-200'
                    : 'bg-red-50 text-red-700 border border-red-200'
                }`}>
                  {passwordMessage.type === 'success' ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <X className="w-4 h-4" />
                  )}
                  <span className="text-sm">{passwordMessage.text}</span>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowPasswordDialog(false)
                  setNewPassword('')
                  setConfirmPassword('')
                  setPasswordMessage(null)
                }}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isChangingPassword}>
                {isChangingPassword && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Cambiar contraseña
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Account Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás completamente seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente tu cuenta
              y todos tus CVs de nuestros servidores.
              <br /><br />
              Para confirmar, escribe <strong>eliminar</strong> en el campo de abajo.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Input
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="Escribe 'eliminar' para confirmar"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteConfirmText('')}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAccount}
              disabled={deleteConfirmText.toLowerCase() !== 'eliminar'}
              className="bg-red-600 hover:bg-red-700"
            >
              Sí, eliminar mi cuenta
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
