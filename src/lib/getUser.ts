import { cookies } from 'next/headers'
import { verifyToken } from './jwt'


export async function getUser() {
  const token = (await cookies()).get('token')?.value
  return token ? verifyToken(token) : null
}
