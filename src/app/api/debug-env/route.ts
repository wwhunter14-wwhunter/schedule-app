import { NextResponse } from 'next/server'
export async function GET() {
  const blobToken = process.env.BLOB_READ_WRITE_TOKEN
  const envKeys = Object.keys(process.env).filter(k => k.includes('BLOB') || k.includes('VERCEL'))
  return NextResponse.json({
    hasBlobToken: !!blobToken,
    tokenPrefix: blobToken?.slice(0, 25) ?? 'undefined',
    relevantEnvKeys: envKeys,
  })
}
