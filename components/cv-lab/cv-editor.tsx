'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { CvJson, CvExperience, CvEducation, CvCertification } from '@/lib/types/cv-lab'

interface CvEditorProps {
  cvJson: CvJson
  onChange: (updated: CvJson) => void
}

// Editable text component
function EditableText({
  value,
  onChange,
  className,
  placeholder,
  multiline = false,
}: {
  value: string
  onChange: (val: string) => void
  className?: string
  placeholder?: string
  multiline?: boolean
}) {
  const ref = useRef<HTMLDivElement>(null)

  const handleBlur = () => {
    if (ref.current) {
      const newValue = ref.current.innerText
      if (newValue !== value) {
        onChange(newValue)
      }
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!multiline && e.key === 'Enter') {
      e.preventDefault()
      ref.current?.blur()
    }
  }

  return (
    <div
      ref={ref}
      contentEditable
      suppressContentEditableWarning
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      className={cn(
        'outline-none focus:bg-blue-50 focus:ring-1 focus:ring-blue-300 rounded px-1 -mx-1 transition-colors',
        !value && 'text-neutral-400 italic',
        className
      )}
    >
      {value || placeholder}
    </div>
  )
}

// Editable bullet item
function EditableBullet({
  value,
  onChange,
  onRemove,
}: {
  value: string
  onChange: (val: string) => void
  onRemove: () => void
}) {
  return (
    <li className="text-sm text-neutral-700 pl-4 relative before:content-['•'] before:absolute before:left-0 before:text-neutral-400 group flex items-start gap-1">
      <EditableText
        value={value}
        onChange={onChange}
        className="flex-1"
        placeholder="Describe tu logro..."
        multiline
      />
      <button
        onClick={onRemove}
        className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition-opacity p-0.5"
      >
        <Trash2 className="h-3 w-3" />
      </button>
    </li>
  )
}

export function CvEditor({ cvJson, onChange }: CvEditorProps) {
  const [cv, setCv] = useState<CvJson>(cvJson)
  const onChangeRef = useRef(onChange)

  // Keep onChange ref updated
  useEffect(() => {
    onChangeRef.current = onChange
  }, [onChange])

  // Update helper - uses ref to avoid stale closure issues
  const update = useCallback((updates: Partial<CvJson>) => {
    setCv(prev => {
      const updated = { ...prev, ...updates }
      // Schedule onChange for next tick to avoid setState during render
      requestAnimationFrame(() => {
        onChangeRef.current(updated)
      })
      return updated
    })
  }, [])

  // Header updates
  const updateHeader = (field: keyof CvJson['header'], value: string) => {
    update({
      header: { ...cv.header, [field]: value }
    })
  }

  // Experience updates
  const updateExperience = (id: string, updates: Partial<CvExperience>) => {
    update({
      experience: cv.experience.map(exp =>
        exp.id === id ? { ...exp, ...updates } : exp
      )
    })
  }

  const addExperienceBullet = (expId: string) => {
    update({
      experience: cv.experience.map(exp =>
        exp.id === expId
          ? { ...exp, bullets: [...exp.bullets, ''] }
          : exp
      )
    })
  }

  const removeExperienceBullet = (expId: string, bulletIndex: number) => {
    update({
      experience: cv.experience.map(exp =>
        exp.id === expId
          ? { ...exp, bullets: exp.bullets.filter((_, i) => i !== bulletIndex) }
          : exp
      )
    })
  }

  const addExperience = () => {
    const newExp: CvExperience = {
      id: `exp-${Date.now()}`,
      role: '',
      company: '',
      startDate: '',
      endDate: '',
      location: '',
      bullets: []
    }
    update({ experience: [...cv.experience, newExp] })
  }

  const removeExperience = (id: string) => {
    update({ experience: cv.experience.filter(exp => exp.id !== id) })
  }

  // Education updates
  const updateEducation = (id: string, updates: Partial<CvEducation>) => {
    update({
      education: cv.education.map(edu =>
        edu.id === id ? { ...edu, ...updates } : edu
      )
    })
  }

  const addEducation = () => {
    const newEdu: CvEducation = {
      id: `edu-${Date.now()}`,
      degree: '',
      field: '',
      institution: '',
      dates: ''
    }
    update({ education: [...cv.education, newEdu] })
  }

  const removeEducation = (id: string) => {
    update({ education: cv.education.filter(edu => edu.id !== id) })
  }

  // Skills updates
  const updateSkills = (type: 'hard' | 'soft', skills: string[]) => {
    update({
      skills: { ...cv.skills, [type]: skills }
    })
  }

  // Certifications updates
  const updateCertification = (id: string, updates: Partial<CvCertification>) => {
    update({
      certifications: cv.certifications.map(cert =>
        cert.id === id ? { ...cert, ...updates } : cert
      )
    })
  }

  const addCertification = () => {
    const newCert: CvCertification = {
      id: `cert-${Date.now()}`,
      name: '',
      issuer: '',
      date: ''
    }
    update({ certifications: [...cv.certifications, newCert] })
  }

  const removeCertification = (id: string) => {
    update({ certifications: cv.certifications.filter(cert => cert.id !== id) })
  }

  return (
    <div className="not-prose text-neutral-800 font-sans">
      {/* Header */}
      <header className="text-center mb-6 pb-4 border-b border-neutral-200">
        <EditableText
          value={cv.header.fullName}
          onChange={(val) => updateHeader('fullName', val)}
          className="text-2xl font-bold text-neutral-900 mb-1"
          placeholder="Tu Nombre Completo"
        />
        <EditableText
          value={cv.header.headline}
          onChange={(val) => updateHeader('headline', val)}
          className="text-base text-blue-600 font-medium mb-2"
          placeholder="Tu Título Profesional"
        />
        <div className="flex items-center justify-center gap-3 text-sm text-neutral-600 flex-wrap">
          <EditableText
            value={cv.header.email}
            onChange={(val) => updateHeader('email', val)}
            placeholder="email@ejemplo.com"
          />
          <span className="text-neutral-300">|</span>
          <EditableText
            value={cv.header.phone || ''}
            onChange={(val) => updateHeader('phone', val)}
            placeholder="+1 234 567 890"
          />
          <span className="text-neutral-300">|</span>
          <EditableText
            value={cv.header.location}
            onChange={(val) => updateHeader('location', val)}
            placeholder="Ciudad, País"
          />
        </div>
      </header>

      {/* Summary */}
      <section className="mb-5">
        <h2 className="text-sm font-bold text-neutral-900 uppercase tracking-wide mb-2 border-b border-neutral-200 pb-1">
          Resumen Profesional
        </h2>
        <EditableText
          value={cv.summary}
          onChange={(val) => update({ summary: val })}
          className="text-sm text-neutral-700 leading-relaxed"
          placeholder="Escribe un resumen de tu perfil profesional..."
          multiline
        />
      </section>

      {/* Experience */}
      <section className="mb-5">
        <div className="flex items-center justify-between mb-3 border-b border-neutral-200 pb-1">
          <h2 className="text-sm font-bold text-neutral-900 uppercase tracking-wide">
            Experiencia Profesional
          </h2>
          <button
            onClick={addExperience}
            className="text-blue-500 hover:text-blue-700 flex items-center gap-1 text-xs"
          >
            <Plus className="h-3 w-3" /> Agregar
          </button>
        </div>
        <div className="space-y-4">
          {cv.experience.map((exp) => (
            <div key={exp.id} className="group relative">
              <button
                onClick={() => removeExperience(exp.id)}
                className="absolute -right-6 top-0 opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition-opacity"
              >
                <Trash2 className="h-4 w-4" />
              </button>
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <EditableText
                    value={exp.role}
                    onChange={(val) => updateExperience(exp.id, { role: val })}
                    className="text-sm font-semibold text-neutral-900"
                    placeholder="Cargo / Rol"
                  />
                  <EditableText
                    value={exp.company}
                    onChange={(val) => updateExperience(exp.id, { company: val })}
                    className="text-sm text-neutral-600"
                    placeholder="Empresa"
                  />
                </div>
                <div className="text-right shrink-0">
                  <div className="flex items-center gap-1 text-xs text-neutral-500">
                    <EditableText
                      value={exp.startDate}
                      onChange={(val) => updateExperience(exp.id, { startDate: val })}
                      placeholder="Inicio"
                    />
                    <span>-</span>
                    <EditableText
                      value={exp.endDate || ''}
                      onChange={(val) => updateExperience(exp.id, { endDate: val })}
                      placeholder="Fin"
                    />
                  </div>
                  <EditableText
                    value={exp.location || ''}
                    onChange={(val) => updateExperience(exp.id, { location: val })}
                    className="text-xs text-neutral-400"
                    placeholder="Ubicación"
                  />
                </div>
              </div>
              <ul className="mt-2 space-y-1">
                {exp.bullets.map((bullet, i) => (
                  <EditableBullet
                    key={i}
                    value={bullet}
                    onChange={(val) => {
                      const newBullets = [...exp.bullets]
                      newBullets[i] = val
                      updateExperience(exp.id, { bullets: newBullets })
                    }}
                    onRemove={() => removeExperienceBullet(exp.id, i)}
                  />
                ))}
              </ul>
              <button
                onClick={() => addExperienceBullet(exp.id)}
                className="mt-1 text-xs text-blue-500 hover:text-blue-700 flex items-center gap-1 ml-4"
              >
                <Plus className="h-3 w-3" /> Agregar logro
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Education */}
      <section className="mb-5">
        <div className="flex items-center justify-between mb-3 border-b border-neutral-200 pb-1">
          <h2 className="text-sm font-bold text-neutral-900 uppercase tracking-wide">
            Educación
          </h2>
          <button
            onClick={addEducation}
            className="text-blue-500 hover:text-blue-700 flex items-center gap-1 text-xs"
          >
            <Plus className="h-3 w-3" /> Agregar
          </button>
        </div>
        <div className="space-y-3">
          {cv.education.map((edu) => (
            <div key={edu.id} className="flex items-start justify-between gap-2 group relative">
              <button
                onClick={() => removeEducation(edu.id)}
                className="absolute -right-6 top-0 opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition-opacity"
              >
                <Trash2 className="h-4 w-4" />
              </button>
              <div className="flex-1">
                <div className="flex items-center gap-1">
                  <EditableText
                    value={edu.degree}
                    onChange={(val) => updateEducation(edu.id, { degree: val })}
                    className="text-sm font-semibold text-neutral-900"
                    placeholder="Título"
                  />
                  {edu.field && <span className="text-sm text-neutral-700">en</span>}
                  <EditableText
                    value={edu.field || ''}
                    onChange={(val) => updateEducation(edu.id, { field: val })}
                    className="text-sm text-neutral-700"
                    placeholder="Campo"
                  />
                </div>
                <EditableText
                  value={edu.institution}
                  onChange={(val) => updateEducation(edu.id, { institution: val })}
                  className="text-sm text-neutral-600"
                  placeholder="Institución"
                />
              </div>
              <EditableText
                value={edu.dates}
                onChange={(val) => updateEducation(edu.id, { dates: val })}
                className="text-xs text-neutral-500 shrink-0"
                placeholder="Fecha"
              />
            </div>
          ))}
        </div>
      </section>

      {/* Skills */}
      <section className="mb-5">
        <h2 className="text-sm font-bold text-neutral-900 uppercase tracking-wide mb-2 border-b border-neutral-200 pb-1">
          Habilidades
        </h2>
        <div className="space-y-2">
          <div>
            <span className="text-xs font-semibold text-neutral-600 uppercase">
              Técnicas:{' '}
            </span>
            <EditableText
              value={cv.skills.hard.join(', ')}
              onChange={(val) => updateSkills('hard', val.split(',').map(s => s.trim()).filter(Boolean))}
              className="text-sm text-neutral-700 inline"
              placeholder="React, TypeScript, Node.js..."
            />
          </div>
          <div>
            <span className="text-xs font-semibold text-neutral-600 uppercase">
              Blandas:{' '}
            </span>
            <EditableText
              value={cv.skills.soft.join(', ')}
              onChange={(val) => updateSkills('soft', val.split(',').map(s => s.trim()).filter(Boolean))}
              className="text-sm text-neutral-700 inline"
              placeholder="Liderazgo, Comunicación..."
            />
          </div>
        </div>
      </section>

      {/* Certifications */}
      <section>
        <div className="flex items-center justify-between mb-2 border-b border-neutral-200 pb-1">
          <h2 className="text-sm font-bold text-neutral-900 uppercase tracking-wide">
            Certificaciones
          </h2>
          <button
            onClick={addCertification}
            className="text-blue-500 hover:text-blue-700 flex items-center gap-1 text-xs"
          >
            <Plus className="h-3 w-3" /> Agregar
          </button>
        </div>
        <div className="space-y-1">
          {cv.certifications.map((cert) => (
            <div key={cert.id} className="flex items-center justify-between gap-2 group relative">
              <button
                onClick={() => removeCertification(cert.id)}
                className="absolute -right-6 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition-opacity"
              >
                <Trash2 className="h-4 w-4" />
              </button>
              <div className="flex items-center gap-1">
                <EditableText
                  value={cert.name}
                  onChange={(val) => updateCertification(cert.id, { name: val })}
                  className="text-sm font-medium text-neutral-900"
                  placeholder="Nombre certificación"
                />
                <span className="text-sm text-neutral-500">-</span>
                <EditableText
                  value={cert.issuer}
                  onChange={(val) => updateCertification(cert.id, { issuer: val })}
                  className="text-sm text-neutral-500"
                  placeholder="Emisor"
                />
              </div>
              <EditableText
                value={cert.date || ''}
                onChange={(val) => updateCertification(cert.id, { date: val })}
                className="text-xs text-neutral-400"
                placeholder="Fecha"
              />
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
