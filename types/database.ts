export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type SpaceType = 'terreno' | 'telhado'
export type SolarOrientation = 'Norte' | 'Sul' | 'Leste' | 'Oeste'
export type RoofType = 'ceramica' | 'metalico' | 'laje' | 'fibrocimento'
export type SpaceStatus = 'available' | 'negotiating' | 'rented'
export type InterestStatus = 'pending' | 'accepted' | 'rejected'
export type UserRole = 'owner' | 'company'

export interface Profile {
  id: string
  email: string
  name: string | null
  role: UserRole
  created_at: string
  onboarding_completed: boolean
}

export interface OwnerProfile {
  id: string
  user_id: string
  full_name: string | null
  cpf_cnpj: string | null
  phone: string | null
  updated_at: string
}

export interface CompanyProfile {
  id: string
  user_id: string
  company_name: string
  cnpj: string | null
  website: string | null
  description: string | null
  updated_at: string
}

export interface Space {
  id: string
  owner_id: string
  type: SpaceType
  address: string
  city: string
  state: string
  lat: number | null
  lng: number | null
  area_m2: number
  solar_orientation: SolarOrientation[]
  roof_type: RoofType | null
  desired_rent: number | null
  description: string | null
  status: SpaceStatus
  created_at: string
  updated_at: string
}

export interface SpacePhoto {
  id: string
  space_id: string
  url: string
  order: number
  created_at: string
}

export interface Interest {
  id: string
  space_id: string
  company_id: string
  status: InterestStatus
  created_at: string
  updated_at: string
}

export interface Message {
  id: string
  interest_id: string
  sender_id: string
  content: string
  read_at: string | null
  created_at: string
}

// Extended types with joins
export interface SpaceWithPhotos extends Space {
  space_photos: SpacePhoto[]
  profiles: Pick<Profile, 'id' | 'name'>
}

export interface InterestWithDetails extends Interest {
  spaces: SpaceWithPhotos
  profiles: Pick<Profile, 'id' | 'name' | 'email'>
  company_profiles: Pick<CompanyProfile, 'company_name' | 'website'>
}

export interface MessageWithSender extends Message {
  profiles: Pick<Profile, 'id' | 'name'>
}
