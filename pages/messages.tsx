// pages/messages.tsx
import Layout from '../components/Layout'

export default function Messages() {
  return (
    <Layout>
      <section className="flex items-center justify-center min-h-[60vh] px-4 py-10 text-center">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-pink-600 mb-4">
            💬 Messagerie
          </h1>
          <p className="text-gray-700 text-base sm:text-lg">
            Cette page affichera bientôt vos messages et conversations privées.
          </p>
        </div>
      </section>
    </Layout>
  )
}
