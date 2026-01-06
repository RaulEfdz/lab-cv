'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Linkedin, Check, Loader2 } from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface LinkedInConnectButtonProps {
  cvId: string
  isConnected?: boolean
  userName?: string
}

export function LinkedInConnectButton({
  cvId,
  isConnected: initialConnected = false,
  userName
}: LinkedInConnectButtonProps) {
  const [isConnected, setIsConnected] = useState(initialConnected)
  const [isLoading, setIsLoading] = useState(false)

  // Check URL params for linkedin connection status
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('linkedin') === 'connected') {
      setIsConnected(true)
      // Clean URL
      window.history.replaceState({}, '', window.location.pathname)
    }
  }, [])

  const handleConnect = () => {
    setIsLoading(true)
    // Redirect to LinkedIn OAuth
    window.location.href = `/api/auth/linkedin?cv_id=${cvId}`
  }

  if (isConnected) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="text-green-600 border-green-200 bg-green-50 hover:bg-green-100 cursor-default"
              disabled
            >
              <Linkedin className="h-4 w-4 mr-2" />
              <Check className="h-3 w-3 mr-1" />
              LinkedIn
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Conectado{userName ? ` como ${userName}` : ''}</p>
            <p className="text-xs text-muted-foreground">
              Pega tu perfil de LinkedIn para importar experiencia
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            onClick={handleConnect}
            disabled={isLoading}
            className="text-[#0A66C2] border-[#0A66C2]/30 hover:bg-[#0A66C2]/10"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Linkedin className="h-4 w-4 mr-2" />
            )}
            Conectar LinkedIn
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Importa nombre, email y foto automáticamente</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
