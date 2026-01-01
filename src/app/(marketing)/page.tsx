import Hero from '@/components/marketing/Hero'
import HowItWorks from '@/components/marketing/HowItWorks'
import TrustSection from '@/components/marketing/TrustSection'
import PricingPreview from '@/components/marketing/PricingPreview'
import CTASection from '@/components/marketing/CTASection'
import SocialProof from '@/components/marketing/SocialProof'

export default function LandingPage() {
  return (
    <div className='flex flex-col'>
      <Hero />
      <HowItWorks />
      <TrustSection />
      <SocialProof />
      <PricingPreview />
      <CTASection />
    </div>
  )
}
