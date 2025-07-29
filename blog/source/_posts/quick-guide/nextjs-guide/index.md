---
title: NextJS Guide
date: 2025-05-08 20:47:19
categories:
- quick-guide
tags:
- nextjs
- react
---

NextJS Fullstack Development Quick Guide

<!--more-->

## Project Strucutre

```bash
root
├── app, server only, include Server Side Render (SSR) pages and API route handlers
├── components, server/client, inclue reusable pure React Components
├── hooks, client only, inclue reusable logic work with states
├── models, server/client, represent domain data structure
├── db, server only
│   ├── migrations, include database migrations
│   └── seeds, define test data
├── public, client only, contains static assets
├── server，server only
│   ├── middlewares, process before route handler and process returned response 
│   ├── repositories, operate with DB
│   ├── services, process main logic
│   └── route-handler-wrapper.ts, is Higher-Order Function (HOF) includes common process before or after route handler
├── services, client only, interact with remote services
├── store/context, client only, manage global states
├── types, server/client, include API contracts and common usage types
├── utils, include reusable helper functions
├── .env, server/client, include environment variables
├── .gitignore, ignore files won't be committed
├── middleware.ts, server only, is nextjs middleware entry, include middlewares from server/middlewares
├── next.config.ts, is nextjs project configuration
├── package.json, define project dependecies
├── README.md, show info about project
└── tsconfig.json, typescript configuration
```

## Environment Variable Management

all variables are defined in `.env` file.

- variable prefix with `NEXT_PUBLIC_`, server/client
- variable prefix **without** `NEXT_PUBLIC_`, server only

```bash
# .env

# expose for client and server
NEXT_PUBLIC_CLIENT_VAR=test

# only expose for server
DATABASE_URL="mysql://root:root@localhost:3306/kid-resource"
```

## Route

nextjs use `app router` for routing, it follows **directory hierarchy**,
all route/controller handlers define in `app` folder, it contains:

- `page.tsx`, Page component with Server Side Render (SSR)
- `route.tsx`, API route handler

```bash
# directory hierarchy example for routing
app
├── api, 
|   ├── users,
|       ├── route.tsx, /api/users
├── posts
|   ├── page.tsx, /posts
|   ├── [<itemId>]
|       ├── page.tsx, /posts/<itemId>
```

![route files](route-files.png)

Reference:

- [Route Handlers](https://nextjs.org/docs/app/getting-started/route-handlers-and-middleware#route-handlers)

### Page Component with SSR

defined in `page.tsx`, it's a **static Server Component** by default,
it will be pre-render during build stage and generate static files.

Limits:

- not use dynamic data or runtime evaluation
- no interactivity or state

Benifits:

- fast initial loading
- SEO optimization
- fetch static data
- use ISR (Incremental Static Regeneration) to regenerate periodly.

```tsx
export default async function HomePage() {
  // static data
  const res = await fetch('https://api.example.com/data', {
    next: { revalidate: 60 } // Revalidate every 60 seconds (ISR)
  });
  const data = await res.json();

  return <div>{data.message}</div>;
}
```

mostly do not use dynamic server component,
if required, please refer [dynamic](https://nextjs.org/docs/app/api-reference/file-conventions/route-segment-config#dynamic)

Reference:

- [Page with SSR](https://nextjs.org/docs/app/api-reference/file-conventions/page)

#### Page Parameters

Page Component parameters source:

- path variables
- query string
- headers

```tsx
import { headers } from 'next/headers'

interface PageProps {
  params: Promise<{ postId: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function Page({ params, searchParams }: PageProps) {
  const { postId } = await params;
  const { pageIndex, pageSize } =  await searchParams;
  const headersList = await headers()
  const posts = await postRepository.findById(itemId, pageIndex, pageSize);
  return (
    <ul>
      {posts.map((post) => (
        <li key={post.id}>{post.title}</li>
      ))}
    </ul>
  )
}
```

Reference:

- [headers](https://nextjs.org/docs/app/api-reference/functions/headers)
- [Dynamic Route Segments](https://nextjs.org/docs/app/api-reference/file-conventions/dynamic-routes)

### Route Handler

defined in `route.tsx` and must export function with **http method name** as handlers.
recommend to use `NextRequest/NextResponse` that extend `Request/Response`.

```tsx
export async function GET(request: NextRequest) {
  return NextResponse.json({ data: "hello world" })
}
```

reference:

- [Route Handlers](https://nextjs.org/docs/app/getting-started/route-handlers-and-middleware#route-handlers)
- [route.js](https://nextjs.org/docs/app/api-reference/file-conventions/route)

#### Route Handler Parameters

Route Handler parameter source:

- path variable
- querystring
- header parameter
- request body

recommend to use `zod` library to validate parameters.

```tsx
// get path variable
import { NextRequest } from 'next/server';
import { headers } from 'next/headers'

interface PageProps {
  params: Promise<{ itemId: string }>
}

export async function POST(req: NextRequest, { params }: PageProps) {
  const body = await req.json();
  const headers = req.headers; // await headers()
  const { itemId } = await params;
  const searchParams = request.nextUrl.searchParams;
  const page = Number(searchParams.get('page'))

  return Response.json({
    message: `Received data for user ${userId}`,
    body,
  });
}
```

## Client Component

follow React rules to create client components.

- require `'use client'` at top of component file
- not async Page
- get data from client state, such like `useState`, `RTK` and so on.

```tsx
'use client'

export default function Page() {
  const { data, error, isLoading } = useQueryByRTK()
 
  if (isLoading) return <div>Loading...</div>
  if (error) return <div>Error: {error.message}</div>
 
  return (
    <ul>
      {data.map((post: { id: string; title: string }) => (
        <li key={post.id}>{post.title}</li>
      ))}
    </ul>
  )
}
```

### Navigation

- use `<Link>` component
- use `useRouter` hook

### Error Handler

**Error Boundary** in `error.tsx` file is only used for client component.

- define a **fixed Error Response** and return it when **expected** error is raised.
- use **Error Boundary** handle **uncaught** exceptions

### Mixture for Server Component with Client Component

- use React's `use` hook to **stream data** with `Promise` from the server to client in Client Component.
- use streaming to break up the page's HTML into smaller chunks and send those chunks from the server to the client.
- wrap Client component with loading component
  - use `loading.tsx` file in route directory
  - wrap with `Suspense` by manual

```tsx
// Server Component part
import Posts from '@/app/ui/posts
import { Suspense } from 'react'
 
export default function Page() {
  // Don't await the data fetching function
  const posts = getPosts()
 
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Posts posts={posts} />
    </Suspense>
  )
}
```

```tsx
// Client Component part
'use client'
import { use } from 'react'
 
export default function Posts({
  posts,
}: {
  posts: Promise<{ id: string; title: string }[]>
}) {
  const allPosts = use(posts)
 
  return (
    <ul>
      {allPosts.map((post) => (
        <li key={post.id}>{post.title}</li>
      ))}
    </ul>
  )
}
```

### Interaction with Server

- invoke API route handlers by request, **recommend**
- invoke server function

#### Invoke Server Function

place `use server` directive at the top of file

```ts
'use server';

export async function createPost(formData: FormData) {
  const title = formData.get('title')
  const content = formData.get('content')
 
  // Update data
  // Revalidate cache
}
```

Server Function used by Client Components

- async invoke in **Event Handlers**
- **Forms** submit event handler

```tsx
import { createPost } from '@/app/actions'
 
export function Form() {
  return (
    <form action={createPost}>
      <input type="text" name="title" />
      <input type="text" name="content" />
      <button type="submit">Create</button>
    </form>
  )
}
```

```tsx
'use client'
 
import { useActionState } from 'react'
import { createPost } from '@/app/actions'
import { LoadingSpinner } from '@/app/ui/loading-spinner'
 
export function Button() {
  const [response, action, pending] = useActionState(createPost, false)
 
  return (
    <button onClick={async () => action()}>
      {pending ? <LoadingSpinner /> : 'Create Post'}
    </button>
  )
}
```

use `useActionState` to get more status of server function invokation.

## Reference

- [NextJS Document](https://nextjs.org/docs)