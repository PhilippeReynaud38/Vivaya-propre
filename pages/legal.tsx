// pages/legal.tsx
import Layout from '../components/Layout'

export default function Legal() {
  return (
    <Layout>
      <section className="max-w-4xl mx-auto p-6 sm:p-10 text-neutral-800">
        <h1 className="text-3xl font-extrabold text-pink-600 mb-6">Mentions légales</h1>

        <p className="mb-4">
          <strong>Dépot légal :</strong> METRE LE DEPOT LEGAL
        </p>

        <p className="mb-4">
          Le design, le code et les visuels sont utilisés uniquement à titre de démonstration.
        </p>

        <p className="mb-4">
          Pour toute demande liée à cette application :{' '}
          <strong className="text-blue-600">contact@vivaya.app</strong>
        </p>
      </section>
    </Layout>
  )
}
