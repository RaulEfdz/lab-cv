'use client'

import React, { useState, useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'
import { X, ZoomIn } from 'lucide-react'

interface PagePaperProps {
    content?: string
    className?: string
    children?: React.ReactNode
    variant?: 'default' | 'minimal'
}

// Función para detectar si el contenido es HTML
function isHtmlContent(content: string): boolean {
    return /<\/?[a-z][\s\S]*>/i.test(content)
}

// Modal para ver imágenes en tamaño completo
function ImageModal({ src, alt, onClose }: { src: string; alt: string; onClose: () => void }) {
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose()
        }
        document.addEventListener('keydown', handleEscape)
        return () => document.removeEventListener('keydown', handleEscape)
    }, [onClose])

    return (
        <div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4"
            onClick={onClose}
        >
            <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors text-white"
                title="Cerrar (ESC)"
            >
                <X size={24} />
            </button>
            <img
                src={src}
                alt={alt}
                className="max-w-[95vw] max-h-[95vh] object-contain rounded-lg shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            />
        </div>
    )
}

export function PagePaper({ content, className, children, variant = 'default' }: PagePaperProps) {
    const [selectedImage, setSelectedImage] = useState<{ src: string; alt: string } | null>(null)
    const contentRef = useRef<HTMLDivElement>(null)

    // Si el contenido es HTML, renderizarlo directamente
    const shouldRenderAsHtml = content && isHtmlContent(content)

    // Usar delegación de eventos para manejar clicks en imágenes
    const handleContentClick = (e: React.MouseEvent<HTMLDivElement>) => {
        const target = e.target as HTMLElement
        if (target.tagName === 'IMG') {
            e.stopPropagation()
            const img = target as HTMLImageElement
            setSelectedImage({
                src: img.src,
                alt: img.alt || 'Imagen'
            })
        }
    }

    // Agregar estilos a las imágenes después de renderizar
    useEffect(() => {
        if (!contentRef.current) return

        const images = contentRef.current.querySelectorAll('img')
        images.forEach(img => {
            img.style.cursor = 'zoom-in'
        })
    }, [content, shouldRenderAsHtml])

    const isMinimal = variant === 'minimal'

    return (
        <>
            <div
                ref={contentRef}
                onClick={handleContentClick}
                className={cn(
                    'mx-auto w-full transition-all duration-200',
                    isMinimal
                        ? 'bg-white p-6 shadow-md rounded-xl min-h-0'
                        : 'bg-white p-6 shadow-xl md:p-10 lg:p-12 max-w-[210mm] min-h-[400px]',
                    'h-auto print:shadow-none',
                    'prose prose-slate prose-base max-w-none dark:prose-invert',
                    'prose-headings:font-bold prose-headings:text-slate-900',
                    'prose-p:leading-relaxed prose-p:text-slate-700',
                    'prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline',
                    'prose-strong:font-semibold prose-strong:text-slate-900',
                    'prose-ul:list-disc prose-ul:pl-6',
                    'prose-ol:list-decimal prose-ol:pl-6',
                    'prose-blockquote:border-l-4 prose-blockquote:border-slate-300 prose-blockquote:pl-4 prose-blockquote:italic',
                    // Estilos para imágenes: limitadas en tamaño con efecto hover
                    'prose-img:max-w-[300px] prose-img:max-h-[200px] prose-img:object-contain',
                    'prose-img:rounded-lg prose-img:border-2 prose-img:border-gray-200',
                    'prose-img:transition-all prose-img:duration-200',
                    'hover:prose-img:border-blue-400 hover:prose-img:shadow-lg hover:prose-img:scale-[1.02]',
                    'prose-img:cursor-zoom-in',
                    className
                )}
            >
                {shouldRenderAsHtml ? (
                    <div dangerouslySetInnerHTML={{ __html: content }} />
                ) : content ? (
                    <div className="whitespace-pre-wrap">{content}</div>
                ) : (
                    children
                )}
            </div>

            {/* Modal para ver imagen completa */}
            {selectedImage && (
                <ImageModal
                    src={selectedImage.src}
                    alt={selectedImage.alt}
                    onClose={() => setSelectedImage(null)}
                />
            )}
        </>
    )
}
