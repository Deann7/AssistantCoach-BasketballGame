This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

### Prerequisites
1. Create a [Vercel account](https://vercel.com/signup)
2. Install the [Vercel CLI](https://vercel.com/cli) (optional but recommended)

### Deployment Steps

#### Option 1: Deploy via Vercel Dashboard (Recommended)
1. Push your code to a Git repository (GitHub, GitLab, or Bitbucket)
2. Go to [Vercel Dashboard](https://vercel.com/new)
3. Import your repository
4. Configure environment variables if needed:
   - `NEXT_PUBLIC_API_BASE_URL`: Your backend API URL
5. Click "Deploy"

#### Option 2: Deploy via Vercel CLI
```bash
# Install Vercel CLI globally
npm install -g vercel

# Login to Vercel
vercel login

# Deploy (run from project root)
vercel

# For production deployment
vercel --prod
```

### Environment Variables
Copy `.env.example` to `.env.local` and update the values:
```bash
cp .env.example .env.local
```

### Build Configuration
The project is configured with:
- `vercel.json` for Vercel-specific settings
- `next.config.js` optimized for Vercel deployment
- Static asset optimization enabled

### Troubleshooting
- Ensure your backend API is accessible from the internet
- Check that all environment variables are properly set in Vercel dashboard
- Verify build logs in Vercel dashboard for any errors

For more details, check out the [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying).
