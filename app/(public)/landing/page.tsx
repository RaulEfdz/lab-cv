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
    <div className="min-h-screen bg-gradient-to-b from-white to-neutral-50">
      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 lg:px-8 pt-20 pb-16">
        <div className="text-center max-w-4xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-orange-50 border border-orange-200 rounded-full px-4 py-2 mb-8">
            <Sparkles className="w-4 h-4 text-orange-600" />
            <span className="text-sm font-medium text-orange-900">
              Optimización de CV con IA
            </span>
          </div>

          {/* Headline */}
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-neutral-900 tracking-tight mb-6">
            CVs que consiguen{' '}
            <span className="bg-gradient-to-r from-orange-500 to-orange-600 bg-clip-text text-transparent">
              mejores trabajos
            </span>
          </h1>

          {/* Subheadline */}
          <p className="text-xl md:text-2xl text-neutral-600 mb-4 leading-relaxed">
            OCTAVIA analiza tu CV con 15 criterios profesionales y te da un{' '}
            <span className="font-semibold text-neutral-900">readiness score en tiempo real</span>.
          </p>
          <p className="text-lg text-neutral-500 mb-8">
            Consigue 80+ puntos y aumenta tus posibilidades en 3x de pasar filtros ATS
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
            <Button
              asChild
              size="lg"
              className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-6 text-lg"
            >
              <Link href="/signup">
                Crea tu CV gratis
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="px-8 py-6 text-lg">
              <Link href="/login">
                Ya tengo cuenta
              </Link>
            </Button>
          </div>

          {/* Readiness Score Demo Visual */}
          <div className="bg-white rounded-2xl border border-neutral-200 p-8 shadow-sm max-w-md mx-auto">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-neutral-600">Tu Readiness Score</span>
              <Badge className="bg-green-500 text-white">Listo</Badge>
            </div>
            <div className="flex items-center gap-4">
              <div className="relative w-24 h-24">
                <svg className="transform -rotate-90 w-24 h-24">
                  <circle
                    cx="48"
                    cy="48"
                    r="40"
                    stroke="#e5e7eb"
                    strokeWidth="8"
                    fill="none"
                  />
                  <circle
                    cx="48"
                    cy="48"
                    r="40"
                    stroke="#22c55e"
                    strokeWidth="8"
                    fill="none"
                    strokeDasharray={`${(85 / 100) * 251.2} 251.2`}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-2xl font-bold text-neutral-900">85</span>
                </div>
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-semibold text-green-600 mb-1">
                  ¡Excelente! CV listo para aplicar
                </p>
                <p className="text-xs text-neutral-500">
                  Tu CV tiene alta probabilidad de pasar filtros ATS
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Problem / Solution */}
      <section className="max-w-7xl mx-auto px-6 lg:px-8 py-16">
        <div className="bg-neutral-900 rounded-3xl p-8 md:p-12 text-white">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-orange-400 mb-2">90%</div>
              <p className="text-neutral-300">de empresas usan ATS para filtrar CVs</p>
            </div>
            <div>
              <div className="text-4xl font-bold text-orange-400 mb-2">25%</div>
              <p className="text-neutral-300">de CVs pasan el primer filtro</p>
            </div>
            <div>
              <div className="text-4xl font-bold text-green-400 mb-2">3x</div>
              <p className="text-neutral-300">más posibilidades con CV Lab</p>
            </div>
          </div>
          <div className="mt-8 text-center">
            <p className="text-lg text-neutral-200">
              <span className="font-semibold text-white">CV Lab optimiza tu CV</span> para pasar filtros automáticos
              y destacar tus fortalezas ante reclutadores.
            </p>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="max-w-7xl mx-auto px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-neutral-900 mb-4">
            Cómo funciona
          </h2>
          <p className="text-lg text-neutral-600">
            Tres pasos simples para transformar tu CV
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Step 1 */}
          <div className="bg-white rounded-2xl border border-neutral-200 p-8 relative">
            <div className="absolute -top-4 left-8 bg-orange-500 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold">
              1
            </div>
            <MessageSquare className="w-12 h-12 text-orange-500 mb-4" />
            <h3 className="text-xl font-semibold text-neutral-900 mb-2">
              Chatea con OCTAVIA
            </h3>
            <p className="text-neutral-600">
              Nuestra IA te guía paso a paso para construir un CV profesional.
              Solo responde sus preguntas naturalmente.
            </p>
          </div>

          {/* Step 2 */}
          <div className="bg-white rounded-2xl border border-neutral-200 p-8 relative">
            <div className="absolute -top-4 left-8 bg-orange-500 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold">
              2
            </div>
            <Target className="w-12 h-12 text-orange-500 mb-4" />
            <h3 className="text-xl font-semibold text-neutral-900 mb-2">
              Score en tiempo real
            </h3>
            <p className="text-neutral-600">
              Ve tu progreso de 0 a 100 mientras completas tu CV.
              Alcanza 80+ puntos para maximizar tus oportunidades.
            </p>
          </div>

          {/* Step 3 */}
          <div className="bg-white rounded-2xl border border-neutral-200 p-8 relative">
            <div className="absolute -top-4 left-8 bg-orange-500 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold">
              3
            </div>
            <FileText className="w-12 h-12 text-orange-500 mb-4" />
            <h3 className="text-xl font-semibold text-neutral-900 mb-2">
              Descarga PDF optimizado
            </h3>
            <p className="text-neutral-600">
              Obtén un PDF profesional listo para aplicar,
              optimizado para ATS y diseñado para impresionar.
            </p>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-neutral-900 mb-4">
            Características que te ayudan a destacar
          </h2>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
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
            <div key={i} className="bg-white rounded-xl border border-neutral-200 p-6 hover:border-orange-200 hover:shadow-md transition-all">
              <feature.icon className="w-8 h-8 text-orange-500 mb-3" />
              <h3 className="text-lg font-semibold text-neutral-900 mb-2">
                {feature.title}
              </h3>
              <p className="text-sm text-neutral-600">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="max-w-7xl mx-auto px-6 lg:px-8 py-16">
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-3xl p-12 text-center text-white">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Consigue el trabajo que mereces
          </h2>
          <p className="text-lg md:text-xl text-orange-50 mb-8 max-w-2xl mx-auto">
            Un CV profesional es tu primera impresión.
            Haz que cuente con CV Lab.
          </p>
          <Button
            asChild
            size="lg"
            className="bg-white text-orange-600 hover:bg-neutral-100 px-8 py-6 text-lg font-semibold"
          >
            <Link href="/signup">
              Comienza gratis ahora
              <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
          </Button>
          <p className="text-sm text-orange-100 mt-4">
            No requiere tarjeta de crédito
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-neutral-200 py-8">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
                <span className="text-white text-xs font-bold">CV</span>
              </div>
              <span className="font-semibold text-neutral-900">CV Lab</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-neutral-600">
              <Link href="/login" className="hover:text-orange-600 transition-colors">
                Iniciar sesión
              </Link>
              <Link href="/signup" className="hover:text-orange-600 transition-colors">
                Crear cuenta
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
