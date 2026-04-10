import { ImageResponse } from 'next/og';
import { supabase } from ' @/lib/supabase';

export const runtime = 'edge';

export async function GET(
  request: Request,
  { params }: { params: { username: string } }
) {
  const username = params.username;

  // 1. Fetch user data for the card
  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, bio, avatar_url, theme")
    .eq("username", username.toLowerCase())
    .maybeSingle();

  if (!profile) return new Response("Not Found", { status: 404 });

  const themeColor = profile.theme === 'midnight' ? '#0F172A' : 
                     profile.theme === 'dark' ? '#1A1A1A' : '#FFFFFF';
  const textColor = profile.theme === 'light' ? '#000000' : '#FFFFFF';

  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: themeColor,
          padding: '80px',
          border: `20px solid ${profile.theme === 'light' ? '#E2E8F0' : '#334155'}`,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '60px' }}>
          {/* Portrait with Aura Border */}
          <div
            style={{
              display: 'flex',
              width: '240px',
              height: '240px',
              borderRadius: '120px',
              border: '8px solid #3B82F6',
              overflow: 'hidden',
            }}
          >
            <img
              src={profile.avatar_url || 'https://via.placeholder.com/240'}
              style={{ objectFit: 'cover', width: '240px', height: '240px' }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', maxWidth: '600px' }}>
            <h1 style={{ fontSize: 72, fontWeight: 900, color: textColor, marginBottom: 0, fontStyle: 'italic' }}>
              {profile.display_name?.toUpperCase() || username.toUpperCase()}
            </h1>
            <p style={{ fontSize: 32, fontWeight: 700, color: '#3B82F6', marginTop: 10 }}>
              @{username}
            </p>
            <p style={{ fontSize: 24, fontWeight: 400, color: textColor, opacity: 0.8, marginTop: 20 }}>
              {profile.bio || "Building my Aura."}
            </p>
          </div>
        </div>
        
        {/* Footer Branding */}
        <div style={{ position: 'absolute', bottom: 60, fontSize: 24, fontWeight: 900, color: textColor, opacity: 0.2, letterSpacing: '0.4em' }}>
          PROJECT AURA
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}