'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { CheckCircle2, XCircle, Clock, Ban } from 'lucide-react'

interface Payment {
  id: string
  user_id: string
  cv_id: string
  amount: string
  currency: string
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'CANCELLED' | 'EXPIRED'
  payment_method: string
  external_id: string | null
  transaction_id: string | null
  yappy_phone: string | null
  paid_at: string | null
  created_at: string
  profiles: {
    id: string
    email: string
    full_name: string | null
  } | null
  cv_lab_cvs: {
    id: string
    title: string
    target_role: string | null
  } | null
}

interface PaymentsTableProps {
  initialPayments: Payment[]
}

export function PaymentsTable({ initialPayments }: PaymentsTableProps) {
  const [payments, setPayments] = useState(initialPayments)
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const filteredPayments = statusFilter === 'all'
    ? payments
    : payments.filter(p => p.status === statusFilter)

  return (
    <div>
      {/* Filtros */}
      <div className="p-4 border-b flex items-center gap-4">
        <label className="text-sm font-medium">Filtrar por estado:</label>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="COMPLETED">Completados</SelectItem>
            <SelectItem value="PENDING">Pendientes</SelectItem>
            <SelectItem value="FAILED">Fallidos</SelectItem>
            <SelectItem value="CANCELLED">Cancelados</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tabla */}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Estado</TableHead>
              <TableHead>Usuario</TableHead>
              <TableHead>CV</TableHead>
              <TableHead>Monto</TableHead>
              <TableHead>Método</TableHead>
              <TableHead>Teléfono</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead>Order ID</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredPayments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                  No hay pagos que mostrar
                </TableCell>
              </TableRow>
            ) : (
              filteredPayments.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell>
                    <PaymentStatusBadge status={payment.status} />
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">
                        {payment.profiles?.full_name || 'Sin nombre'}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {payment.profiles?.email}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">
                        {payment.cv_lab_cvs?.title || 'CV eliminado'}
                      </div>
                      {payment.cv_lab_cvs?.target_role && (
                        <div className="text-sm text-muted-foreground">
                          {payment.cv_lab_cvs.target_role}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="font-mono">
                    ${parseFloat(payment.amount).toFixed(2)} {payment.currency}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{payment.payment_method}</Badge>
                  </TableCell>
                  <TableCell className="font-mono">
                    {payment.yappy_phone || '-'}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {new Date(payment.created_at).toLocaleDateString('es-PA', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {payment.external_id || '-'}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

function PaymentStatusBadge({ status }: { status: Payment['status'] }) {
  const config = {
    COMPLETED: {
      icon: CheckCircle2,
      variant: 'success' as const,
      label: 'Completado',
    },
    PENDING: {
      icon: Clock,
      variant: 'warning' as const,
      label: 'Pendiente',
    },
    FAILED: {
      icon: XCircle,
      variant: 'destructive' as const,
      label: 'Fallido',
    },
    CANCELLED: {
      icon: Ban,
      variant: 'secondary' as const,
      label: 'Cancelado',
    },
    EXPIRED: {
      icon: XCircle,
      variant: 'secondary' as const,
      label: 'Expirado',
    },
  }

  const { icon: Icon, variant, label } = config[status] || config.PENDING

  return (
    <Badge variant={variant} className="gap-1">
      <Icon className="w-3 h-3" />
      {label}
    </Badge>
  )
}
