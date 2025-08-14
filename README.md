# MagicKit - Better Auth Integration

A SvelteKit application with integrated Better Auth authentication system, featuring user management, admin panel, and modern UI components.

## Features

- 🔐 **Better Auth Integration** - Secure authentication with email/password and social login
- 👥 **User Management** - Admin panel for managing users, roles, and permissions
- 🎨 **Modern UI** - Built with shadcn-svelte components and Tailwind CSS
- 📱 **Responsive Design** - Works on all devices
- 🚀 **Svelte 5** - Latest Svelte features and syntax
- 🗄️ **MongoDB** - Persistent data storage

## Getting Started

### Prerequisites

- Node.js 18+ or Bun
- MongoDB running locally or accessible via connection string

### Installation

1. Clone the repository
2. Install dependencies:

   ```bash
   bun install
   ```

3. Set up environment variables in `.env`:

   ```env
   BETTER_AUTH_SECRET=your-secret-key
   BETTER_AUTH_URL=http://localhost:5173
   PUBLIC_BETTER_AUTH_URL=http://localhost:5173
   MONGODB_URI=mongodb://localhost:27017/magickit
   ```

4. Start the development server:

   ```bash
   bun run dev
   ```

5. Open [http://localhost:5173](http://localhost:5173) in your browser

## Authentication Flow

### User Registration

1. Navigate to `/signup`
2. Fill in your details (name, email, password)
3. Click "Create Account"
4. You'll be automatically logged in and redirected based on your role

### User Login

1. Navigate to `/login`
2. Enter your email and password
3. Click "Sign In"
4. You'll be redirected based on your role:
   - **Admin users** → `/admin` (Admin Panel)
   - **Regular users** → Previous page or home

### Admin Panel

- Access at `/admin` (admin users only)
- Create new users
- Manage user roles (user/admin)
- Ban/unban users
- Search and filter users
- Pagination support

### My Account

- Access at `/my-account` (authenticated users only)
- View and edit profile information
- Sign out

## Project Structure

```
src/
├── lib/
│   ├── auth/
│   │   ├── auth.ts          # Better Auth server configuration
│   │   └── auth-client.ts   # Better Auth client configuration
│   ├── components/
│   │   ├── header.svelte    # Navigation header
│   │   ├── login-form.svelte # Login form component
│   │   └── signup-form.svelte # Signup form component
│   └── db/
│       └── dbClient.ts      # MongoDB connection
├── routes/
│   ├── admin/               # Admin panel
│   ├── login/               # Login page
│   ├── signup/              # Signup page
│   ├── my-account/          # User profile
│   └── +layout.svelte       # Root layout with header
└── hooks.server.ts          # Server-side authentication handling
```

## Better Auth Configuration

The application uses Better Auth with the following plugins:

- **Admin Plugin** - User management and role-based access control
- **SvelteKit Cookies** - Proper cookie handling for SvelteKit
- **MongoDB Adapter** - Database integration

### User Roles

- **user** - Default role for regular users
- **admin** - Administrative access with full user management capabilities

## Development

### Available Scripts

- `bun run dev` - Start development server
- `bun run build` - Build for production
- `bun run preview` - Preview production build
- `bun run check` - Type check
- `bun run lint` - Lint code
- `bun run format` - Format code

### Adding New Features

1. **New Routes**: Add pages in `src/routes/`
2. **New Components**: Create in `src/lib/components/`
3. **Authentication**: Use `authClient` from `$lib/auth/auth-client`
4. **Server Actions**: Access user data via `event.locals.user`

## Troubleshooting

### Database Connection Issues

- Ensure MongoDB is running
- Check your connection string in `.env`
- Verify network access to MongoDB

### Authentication Issues

- Check browser console for errors
- Verify environment variables are set correctly
- Ensure Better Auth secret is properly configured

### Build Issues

- Run `bun run check` to identify TypeScript errors
- Ensure all dependencies are installed
- Check SvelteKit configuration

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is open source and available under the [MIT License](LICENSE).
