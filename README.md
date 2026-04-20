# Kinify

Kinify is a simple music streaming and sharing web-app. Built with React and Supabase, it allows users to stream, upload, and interact with people.

## Features

- **Authentication**: Email & Social logins.
- **Library & Playlists**: Manage your liked songs and custom playlists.
- **Studio & Upload**: Creators can upload their music easily with custom genres and album covers.

## Stack

- **Frontend**: React, Vite, Tailwind CSS
- **Backend/DB**: Supabase (PostgreSQL, Storage, Auth)

## Quick Start

1. **Clone the repo:**
   ```bash
   git clone https://github.com/manisharavindh/kinify.git
   cd kinify
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up Supabase:**
   - Create a project on [Supabase](https://supabase.com/).
   - Execute the schema provided in `supabase-schema.sql` via Supabase SQL Editor.
   - Run the data seed `supabase-seed.sql` if you want initial data.
   - Set up your `.env` variables using `.env.example` as a template:
     ```env
     VITE_SUPABASE_URL=your-project-url
     VITE_SUPABASE_ANON_KEY=your-anon-key
     ```

4. **Run the app locally:**
   ```bash
   npm run dev
   ```

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
