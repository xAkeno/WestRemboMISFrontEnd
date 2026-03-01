import React from 'react'
import Header from "@/components/forms/Header";
import { useToast } from '@/components/ui/use-toast';
import RequestFormSection from '@/components/forms/RequestFormSection';
import ServiceCards from './ServiceCards';
const ServicesRequest = () => {
  return (
    <div>
        <Header/>
        <div className='pt-24'>
            <ServiceCards />
        </div>
    </div>
  )
}

export default ServicesRequest