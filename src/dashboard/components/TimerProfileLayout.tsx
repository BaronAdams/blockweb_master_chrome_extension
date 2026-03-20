import { getProfileDetails } from '@/background/profiles'
import { Outlet } from 'react-router-dom'
import type { LoaderFunctionArgs } from 'react-router-dom'

export async function loader({ params } : LoaderFunctionArgs){ 
    const profile = await getProfileDetails(params.profileId!)
    return { currentProfile : profile }
}

const TimerProfileLayout = () => {
  return (
    <Outlet/>
  )
}

export default TimerProfileLayout