#!/bin/bash
echo "Fixing permissions for frontend-admin..."
sudo chown -R $(whoami) frontend-admin

echo "Installing dependencies..."
cd frontend-admin
npm install axios clsx tailwind-merge lucide-react framer-motion zod react-hook-form sonner class-variance-authority

echo "Creating directory structure..."
mkdir -p components/ui components/layout lib hooks types app/\(auth\)/login app/\(dashboard\)/tenants app/\(dashboard\)/packages

echo "Setup complete! You can now let the AI continue."
