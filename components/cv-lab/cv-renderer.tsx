'use client'

import type { CvJson } from '@/lib/types/cv-lab'

interface CvRendererProps {
  cvJson: CvJson
}

export function CvRenderer({ cvJson }: CvRendererProps) {
  const { header, summary, experience, education, skills, certifications } = cvJson

  return (
    <div className="not-prose text-neutral-800 font-sans">
      {/* Header */}
      <header className="text-center mb-6 pb-4 border-b border-neutral-200">
        <h1 className="text-2xl font-bold text-neutral-900 mb-1">
          {header.fullName || 'Tu Nombre'}
        </h1>
        {header.headline && (
          <p className="text-base text-blue-600 font-medium mb-2">
            {header.headline}
          </p>
        )}
        <div className="flex items-center justify-center gap-3 text-sm text-neutral-600 flex-wrap">
          {header.email && <span>{header.email}</span>}
          {header.phone && (
            <>
              <span className="text-neutral-300">|</span>
              <span>{header.phone}</span>
            </>
          )}
          {header.location && (
            <>
              <span className="text-neutral-300">|</span>
              <span>{header.location}</span>
            </>
          )}
        </div>
        {header.links.length > 0 && (
          <div className="flex items-center justify-center gap-3 text-sm text-blue-600 mt-2 flex-wrap">
            {header.links.map((link, i) => (
              <a
                key={i}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline"
              >
                {link.label}
              </a>
            ))}
          </div>
        )}
      </header>

      {/* Summary */}
      {summary && (
        <section className="mb-5">
          <h2 className="text-sm font-bold text-neutral-900 uppercase tracking-wide mb-2 border-b border-neutral-200 pb-1">
            Resumen Profesional
          </h2>
          <p className="text-sm text-neutral-700 leading-relaxed">
            {summary}
          </p>
        </section>
      )}

      {/* Experience */}
      {experience.length > 0 && (
        <section className="mb-5">
          <h2 className="text-sm font-bold text-neutral-900 uppercase tracking-wide mb-3 border-b border-neutral-200 pb-1">
            Experiencia Profesional
          </h2>
          <div className="space-y-4">
            {experience.map((exp, i) => (
              <div key={exp.id || i}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-semibold text-neutral-900">
                      {exp.role}
                    </h3>
                    <p className="text-sm text-neutral-600">{exp.company}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs text-neutral-500">
                      {exp.startDate} - {exp.endDate || 'Presente'}
                    </p>
                    {exp.location && (
                      <p className="text-xs text-neutral-400">{exp.location}</p>
                    )}
                  </div>
                </div>
                {exp.bullets.length > 0 && (
                  <ul className="mt-2 space-y-1">
                    {exp.bullets.map((bullet, i) => (
                      <li
                        key={i}
                        className="text-sm text-neutral-700 pl-4 relative before:content-['•'] before:absolute before:left-0 before:text-neutral-400"
                      >
                        {bullet}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Education */}
      {education.length > 0 && (
        <section className="mb-5">
          <h2 className="text-sm font-bold text-neutral-900 uppercase tracking-wide mb-3 border-b border-neutral-200 pb-1">
            Educación
          </h2>
          <div className="space-y-3">
            {education.map((edu, i) => (
              <div key={edu.id || i} className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="text-sm font-semibold text-neutral-900">
                    {edu.degree}
                    {edu.field && ` en ${edu.field}`}
                  </h3>
                  <p className="text-sm text-neutral-600">{edu.institution}</p>
                </div>
                <p className="text-xs text-neutral-500 shrink-0">{edu.dates}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Skills */}
      {(skills.hard.length > 0 || skills.soft.length > 0) && (
        <section className="mb-5">
          <h2 className="text-sm font-bold text-neutral-900 uppercase tracking-wide mb-2 border-b border-neutral-200 pb-1">
            Habilidades
          </h2>
          <div className="space-y-2">
            {skills.hard.length > 0 && (
              <div>
                <span className="text-xs font-semibold text-neutral-600 uppercase">
                  Técnicas:{' '}
                </span>
                <span className="text-sm text-neutral-700">
                  {skills.hard.join(', ')}
                </span>
              </div>
            )}
            {skills.soft.length > 0 && (
              <div>
                <span className="text-xs font-semibold text-neutral-600 uppercase">
                  Blandas:{' '}
                </span>
                <span className="text-sm text-neutral-700">
                  {skills.soft.join(', ')}
                </span>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Certifications */}
      {certifications.length > 0 && (
        <section>
          <h2 className="text-sm font-bold text-neutral-900 uppercase tracking-wide mb-2 border-b border-neutral-200 pb-1">
            Certificaciones
          </h2>
          <div className="space-y-1">
            {certifications.map((cert, i) => (
              <div key={cert.id || i} className="flex items-center justify-between gap-2">
                <div>
                  <span className="text-sm font-medium text-neutral-900">
                    {cert.name}
                  </span>
                  <span className="text-sm text-neutral-500"> - {cert.issuer}</span>
                </div>
                {cert.date && (
                  <span className="text-xs text-neutral-400">{cert.date}</span>
                )}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
