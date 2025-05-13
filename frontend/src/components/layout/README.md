# Layout Components

This directory contains the main layout components for the EduGuardian application.

## Components

### Sidebar.tsx

A responsive sidebar navigation component that:
- Adapts to mobile and desktop viewports
- Has collapsible sections
- Shows different menu items based on authentication status
- Includes document-specific tools when viewing notes
- Provides conditional rendering of features based on user quotas

### Header.tsx

A header component that:
- Shows user streak and XP information when authenticated
- Provides login/register buttons when not authenticated
- Includes a notification system with unread indicators
- Features a dark mode toggle
- Displays motivational quotes

## TypeScript Interfaces

Both components are fully typed with TypeScript interfaces for:
- Menu items
- User data
- Notifications
- Component props

## Features

- **Responsive Design**: Both components adapt to different screen sizes
- **Animation**: Uses Framer Motion for smooth transitions
- **Authentication Integration**: Shows different UI elements based on auth status
- **Theming**: Dark mode support through Tailwind CSS classes
- **Accessibility**: Proper ARIA attributes and keyboard navigation

## Usage

These components are automatically included in the App layout and don't need to be imported separately in page components. 