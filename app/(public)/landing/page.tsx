import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Sparkles,
  TrendingUp,
  Target,
  CheckCircle2,
  Star,
  ArrowRight,
  Zap,
  FileText,
  MessageSquare
} from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-primary)' }}>
      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 md:px-12 lg:px-16 py-16 md:py-24 lg:py-32 min-h-[700px] flex items-center">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center w-full">
          {/* Left Column - Text Content */}
          <div className="space-y-8">
            {/* Label */}
            <span className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
              Optimización de CV con IA
            </span>

            {/* Headline */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-none" style={{ color: 'var(--text-primary)' }}>
              CVs que consiguen mejores trabajos
            </h1>

            {/* Description */}
            <div className="max-w-md space-y-3">
              <p className="text-lg md:text-xl leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                OCTAVIA analiza tu CV con 15 criterios profesionales y te da un{' '}
                <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>readiness score en tiempo real</span>.
              </p>
              <p className="text-base" style={{ color: 'var(--text-muted)' }}>
                Consigue 80+ puntos y aumenta tus posibilidades en 3x de pasar filtros ATS
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-2">
              <Button
                asChild
                size="lg"
                className="text-sm font-medium px-6 py-3 rounded-lg"
                style={{ backgroundColor: 'var(--bg-dark)', color: 'var(--bg-surface)' }}
              >
                <Link href="/signup" className="inline-flex items-center justify-center">
                  Crea tu CV gratis
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="text-sm font-medium px-6 py-3 rounded-lg border hover:border-[var(--accent-orange)] hover:text-[var(--accent-orange)] transition-colors"
                style={{ borderColor: 'var(--border)' }}
              >
                <Link href="/login" className="inline-flex items-center justify-center">
                  Ya tengo cuenta
                </Link>
              </Button>
            </div>
          </div>

          {/* Right Column - Blob Gradient Visual */}
          <div className="hidden lg:block relative w-full h-[500px]">
            <div className="blob-gradient absolute inset-0 rounded-3xl"></div>
          </div>
        </div>
      </section>

      {/* Problem / Solution */}
      <section className="max-w-7xl mx-auto px-6 md:px-12 lg:px-16 py-16 md:py-24 lg:py-32">
        <div className="rounded-3xl p-8 md:p-12" style={{ backgroundColor: 'var(--bg-dark)', color: 'var(--bg-surface)' }}>
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold mb-2" style={{ color: 'var(--accent-orange)' }}>90%</div>
              <p style={{ color: 'var(--text-light)' }}>de empresas usan ATS para filtrar CVs</p>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2" style={{ color: 'var(--accent-orange)' }}>25%</div>
              <p style={{ color: 'var(--text-light)' }}>de CVs pasan el primer filtro</p>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2" style={{ color: 'var(--accent-orange)' }}>3x</div>
              <p style={{ color: 'var(--text-light)' }}>más posibilidades con CV Lab</p>
            </div>
          </div>
          <div className="mt-8 text-center">
            <p className="text-lg" style={{ color: 'var(--text-light)' }}>
              <span className="font-semibold" style={{ color: 'var(--bg-surface)' }}>CV Lab optimiza tu CV</span> para pasar filtros automáticos
              y destacar tus fortalezas ante reclutadores.
            </p>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="max-w-7xl mx-auto px-6 md:px-12 lg:px-16 py-16 md:py-24 lg:py-32" style={{ backgroundColor: 'var(--bg-surface)' }}>
        <div className="mb-12 md:mb-16">
          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight mb-4" style={{ color: 'var(--text-primary)' }}>
            Cómo funciona
          </h2>
          <p className="text-lg mt-4 max-w-2xl" style={{ color: 'var(--text-secondary)' }}>
            Tres pasos simples para transformar tu CV
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 md:gap-8">
          {/* Step 1 */}
          <div className="rounded-2xl border p-6 md:p-8 relative hover:border-opacity-100 transition-colors" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-light)' }}>
            <div className="absolute -top-4 left-8 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm" style={{ backgroundColor: 'var(--accent-orange)', color: 'var(--bg-surface)' }}>
              1
            </div>
            <MessageSquare className="w-12 h-12 mb-4" style={{ color: 'var(--text-secondary)' }} />
            <h3 className="text-xl font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
              Chatea con OCTAVIA
            </h3>
            <p style={{ color: 'var(--text-secondary)' }}>
              Nuestra IA te guía paso a paso para construir un CV profesional.
              Solo responde sus preguntas naturalmente.
            </p>
          </div>

          {/* Step 2 */}
          <div className="rounded-2xl border p-6 md:p-8 relative hover:border-opacity-100 transition-colors" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-light)' }}>
            <div className="absolute -top-4 left-8 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm" style={{ backgroundColor: 'var(--accent-orange)', color: 'var(--bg-surface)' }}>
              2
            </div>
            <Target className="w-12 h-12 mb-4" style={{ color: 'var(--text-secondary)' }} />
            <h3 className="text-xl font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
              Score en tiempo real
            </h3>
            <p style={{ color: 'var(--text-secondary)' }}>
              Ve tu progreso de 0 a 100 mientras completas tu CV.
              Alcanza 80+ puntos para maximizar tus oportunidades.
            </p>
          </div>

          {/* Step 3 */}
          <div className="rounded-2xl border p-6 md:p-8 relative hover:border-opacity-100 transition-colors" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-light)' }}>
            <div className="absolute -top-4 left-8 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm" style={{ backgroundColor: 'var(--accent-orange)', color: 'var(--bg-surface)' }}>
              3
            </div>
            <FileText className="w-12 h-12 mb-4" style={{ color: 'var(--text-secondary)' }} />
            <h3 className="text-xl font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
              Descarga PDF optimizado
            </h3>
            <p style={{ color: 'var(--text-secondary)' }}>
              Obtén un PDF profesional listo para aplicar,
              optimizado para ATS y diseñado para impresionar.
            </p>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-6 md:px-12 lg:px-16 py-16 md:py-24 lg:py-32">
        <div className="mb-12 md:mb-16">
          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight" style={{ color: 'var(--text-primary)' }}>
            Características que te ayudan a destacar
          </h2>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {[
            {
              icon: Star,
              title: 'Readiness Score',
              description: 'Medición objetiva de 0-100 que evalúa 15 criterios profesionales'
            },
            {
              icon: Zap,
              title: 'Optimización ATS',
              description: 'Formato y keywords optimizados para pasar filtros automáticos'
            },
            {
              icon: TrendingUp,
              title: 'Métricas cuantificables',
              description: 'OCTAVIA te ayuda a expresar logros con números que impactan'
            },
            {
              icon: Target,
              title: 'Formato STAR',
              description: 'Estructura probada: Situación, Tarea, Acción, Resultado'
            },
            {
              icon: Sparkles,
              title: 'Feedback en tiempo real',
              description: 'Mejoras instantáneas mientras construyes tu CV'
            },
            {
              icon: CheckCircle2,
              title: 'Validación profesional',
              description: 'Asegura que tu CV cumple estándares de la industria'
            }
          ].map((feature, i) => (
            <div
              key={i}
              className="rounded-xl border p-6 hover:-translate-y-1 transition-all duration-300"
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: 'var(--border-light)'
              }}
            >
              <feature.icon className="w-8 h-8 mb-3" style={{ color: 'var(--text-secondary)' }} />
              <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                {feature.title}
              </h3>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="max-w-7xl mx-auto px-6 md:px-12 lg:px-16 py-16 md:py-24 lg:py-32">
        <div className="rounded-3xl p-12 text-center" style={{ backgroundColor: 'var(--bg-dark)', color: 'var(--bg-surface)' }}>
          <h2 className="text-3xl md:text-4xl font-semibold mb-4">
            Consigue el trabajo que mereces
          </h2>
          <p className="text-lg md:text-xl mb-8 max-w-2xl mx-auto" style={{ color: 'var(--text-light)' }}>
            Un CV profesional es tu primera impresión.
            Haz que cuente con CV Lab.
          </p>
          <Button
            asChild
            size="lg"
            className="px-6 py-3 text-sm font-medium rounded-lg transition-colors"
            style={{ backgroundColor: 'var(--accent-orange)', color: 'var(--bg-surface)' }}
          >
            <Link href="/signup" className="inline-flex items-center justify-center">
              Comienza gratis ahora
              <ArrowRight className="ml-2 w-4 h-4" />
            </Link>
          </Button>
          <p className="text-sm mt-4" style={{ color: 'var(--text-light)' }}>
            No requiere tarjeta de crédito
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8" style={{ backgroundColor: 'var(--bg-dark)', borderColor: 'var(--border)' }}>
        <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-16">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'var(--accent-orange)' }}>
                <span className="text-xs font-bold" style={{ color: 'var(--bg-surface)' }}>CV</span>
              </div>
              <span className="font-semibold" style={{ color: 'var(--bg-surface)' }}>CV Lab</span>
            </div>
            <div className="flex items-center gap-6 text-sm">
              <Link href="/login" className="transition-colors" style={{ color: 'var(--text-muted)' }}>
                Iniciar sesión
              </Link>
              <Link href="/signup" className="transition-colors" style={{ color: 'var(--text-muted)' }}>
                Crear cuenta
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
