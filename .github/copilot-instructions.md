## 🧱 Copilot Instruction Guide for Full-Stack (Laravel + Inertia.js + React + Zustand + TS + AntD + @gsap/react + Workbox pwa)

You are an expert senior fullstack developer working on **TurfHub**, a progressive web app for managing mini football turf sessions (match queueing, team creation, session management, payments).

## Backend

### Laravel

- **Eloquent ORM:**
  - Use `findOrFail()` or `firstOrFail()` to automatically handle "not found" scenarios.
  - Utilize Eager Loading (`with()`) to prevent N+1 query problems.
  - Define clear relationships in your models.
  - Use API Resources for transforming models and collections before sending them to the frontend, ensuring a consistent API structure.
  - user model's when method for conditional queries.
- **Routing:** Group related routes and use route model binding. Name your routes for easier URL generation.
- **Form Requests:** Use Form Request classes for validation and authorization of incoming requests. This keeps controllers lean.
- **Services:** consider using Service classes for encapsulating domain-specific business logic. This promotes single responsibility and reusability.
- **Configuration:** Use .env files for environment-specific configuration and access them via the `config()` helper.
- **Eloquent Relationships & Query Scopes:** Use Eloquent relationships and query scopes for reusable queries.
- **Type Hinting & Return Types:** Use **type-hinting** and **return types** in all methods.
- **Utilizing Observers and Events:** Leverage Laravel's model observers and events when needed for handling actions that require another action to be taken in another context.
- **Utilize Model Observers:** Use model observers for handling post actions to be done after a model is created, updated, or deleted.
- **Avoid unnecessary patterns** Avoid returning response()->json() in controllers, 'status' = true and 'message' in responses and avoid inline class imports like `App\Http\Controllers\Api\BankAccountController` instead of `BankAccountController`.

### Laravel + API + Inertia.js Data Provider Logic

To reuse data provider logic effectively in a Laravel and Inertia.js application, ensuring the same data can be served to both your Inertia frontend and other platforms (like mobile apps via APIs), consider the following best practices:

1.  **Service/Action Classes for Business Logic:**
    - Encapsulate your core data retrieval and business logic within dedicated Service or Action classes. These classes will be responsible for fetching and processing data, independent of how it's presented (HTML via Inertia or JSON via API).
    - Your Laravel controllers (both for Inertia and API) will then call these services/actions to get the data. This keeps your controllers lean and promotes the Single Responsibility Principle.

2.  **Laravel API Resources for Data Transformation:**
    - Utilize Laravel API Resources to transform your Eloquent models and collections into the desired output structure.
    - These resources can be used by both your Inertia controllers (to prepare props) and your API controllers (to generate JSON responses). This ensures a consistent data structure across all consumers.
    - You can conditionally include data or relationships within your API Resources based on the request or context if needed.

3.  **Reusable Form Request Validation:**
    - Use Form Request classes for validating incoming data. These can be type-hinted in both your Inertia and API controller methods, ensuring consistent validation rules are applied regardless of the entry point.

**Example Workflow:**

- **Data Logic:** A `ProductService` might have a method `getActiveProducts()` that fetches all active products with their necessary relationships.
- **Transformation:** A `ProductResource` transforms a `Product` model into a structured array/JSON.
- **API Controller:**

  ```php
  // filepath: app/Http/Controllers/Api/ProductController.php
  use App\Http\Resources\ProductResource;
  use App\Services\ProductService;
  use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

  class ProductController extends Controller
  {
      protected ProductService $productService;

      public function __construct(ProductService $productService)
      {
          $this->productService = $productService;
      }

      public function index(): AnonymousResourceCollection
      {
          $products = $this->productService->getActiveProducts();
          return ProductResource::collection($products);
      }
  }
  ```

## Frontend

🧩 Interaction Patterns:

- Reuse **pop-out menus, sliding drawers, dropdowns, and modals**
- Add **feedback states**: loading, success, error
- Resizable panels or collapsible menus (e.g., Team list, Player panel)

### Design Patterns

- **Card with Icons:** Cards with title or metas should have icons to represent the content visually.
- **Container/Presentational Components:** Separate logic (container) from UI (presentational) components. Container components handle data fetching and state management, while presentational components focus on rendering UI.
- **Optimize for Mobile:** Ensure components are responsive and touch-friendly.

### Inertia.js

- **Data Props:** Be selective about the data you pass from Laravel controllers to Inertia pages. Only pass what's necessary for the initial page load; every other data will be fetched independently.
- **`usePage` Hook:** Access shared data and props in your React components using the `usePage().props` hook.
- **Partial Reloads:** Utilize partial reloads (`only` and `except` options) to optimize data fetching when only a portion of the page's data needs to be updated.
- **`remember`:** Use Inertia's `remember` functionality for preserving component state across page visits, especially for form inputs or filters.
- **Error Handling:** Use Inertia's error handling (`$page.props.errors`) to display validation errors from Laravel.
- **Routing:** Use Inertia's `<Link>` component or `router.visit()` for client-side navigation.
- **Shared Props:** Use **shared props** for global data (e.g., user, flash messages).

### React — Modern Patterns & Best Practices 🧩

#### Purpose

This document outlines recommended practices and patterns when building React (v18+) applications. The goal is to help one to write **lean, readable, maintainable, and high-performance** React code by using modern hooks, lazy loading, concurrency APIs, and modular structure.

- **Functional Components & Hooks:** Embrace functional components and hooks (`useState`, `useEffect`, `useContext`, `useMemo`, `useCallback`) for managing state and side effects.
- **Component Composition:** Break down UI into small, reusable components. Favor composition over inheritance.
- **Props:** Keep props minimal and clearly defined. Use TypeScript interfaces for prop types.
- **State Management:** For local component state, `useState` is often sufficient. For more complex, shared state, use Zustand.
- **Memoization & Performance:** Use `React.memo` for components and `useMemo`/`useCallback` for functions and values to prevent unnecessary re-renders.
- **Component State Encapsulation:** Keep component state encapsulated. Avoid lifting state up unless necessary.
- **Avoid deeply nested JSX:** Break down large components into smaller sub-components to improve readability and maintainability in the same file that doesn't need to have its component in a separate file.
  example:

```tsx
import { memo } from 'react';

interface ItemsProps {
  items: ItemProps[];
}

const ItemList = memo(({ items }: ItemsProps) => {
  return (
    <ul>
      {items.map((item) => (
        <Item key={item.id} item={item} />
      ))}
    </ul>
  );
});

interface ItemProps {
  item: { id: number; title: string; description: string };
}

const Item = memo(({ item }: ItemProps) => (
  <li>
    <h3>{item.title}</h3>
    <p>{item.description}</p>
  </li>
));
export default ItemList;
```

-- ** Subcomponents Resource Flex ** Subcomponents that accept a resource in props should also accept the resource id in case the resource is not available in the props, this will allow the component to fetch the resource data from the api module.

## Concurrent Rendering & Transitions (React 18+)

Modern React (v18+) offers **concurrent rendering primitives** to make UIs more responsive by deferring or prioritizing updates:

### 🔹 Key APIs

- **`startTransition` / `useTransition`** — mark state updates as _non-urgent_, so UI stays responsive during heavy updates. ([tramvai.dev][6])
- **`useDeferredValue`** — defer updating less-critical parts of UI (e.g. large lists) while prioritizing UI responsiveness. ([GitHub][7])
- **Improved `<Suspense>` behavior** — with concurrent rendering, parts of the UI can “suspend” (e.g. while fetching data or loading code), allowing other parts to remain interactive. ([React][5])

### ✅ When to apply:

- For heavy renders (large lists, complex computations) triggered by user actions (search/filter, routing, big state changes).
- When you want to maintain UI responsiveness during transitions (e.g. navigation, layout change).
- For code/data loading — combine `Suspense`, concurrent features and lazy loading for best UX.

### Example:

```js
import { useState, startTransition } from 'react';

function SearchComponent({ allItems }) {
  const [query, setQuery] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const handleChange = (e) => {
    const value = e.target.value;
    setQuery(value);
    startTransition(() => {
      setSearchTerm(value);
    });
  };

  const filtered = useMemo(() => {
    return allItems.filter((item) => item.name.includes(searchTerm));
  }, [allItems, searchTerm]);

  return (
    <input value={query} onChange={handleChange} />
    // ... render filtered list
  );
}
```

This ensures input remains responsive even if filtering a large list is expensive.

## 5. Modularization: Custom Hooks & Separation of Concerns

- Custom hooks make code DRY (Don’t Repeat Yourself), easier to test, and more composable.
- Combine hooks (e.g. state, side-effects, memoization) to encapsulate behavior cleanly.

Example:

```js
// useCounter.js
import { useState, useCallback } from 'react';

export function useCounter(initial = 0) {
  const [count, setCount] = useState(initial);
  const increment = useCallback(() => setCount((c) => c + 1), []);
  const decrement = useCallback(() => setCount((c) => c - 1), []);
  return { count, increment, decrement };
}
```

## 6. Component Design & Props Handling

- Prefer **small, focused components**. Each component should have a single responsibility (UI rendering, data fetching, event handling, etc.).
- Use **descriptive prop names** — avoid passing large objects; prefer explicit props when possible.
- For derived data (e.g. filtered lists, sorted arrays), compute them with `useMemo` (as above) to avoid unnecessary work.
- Use **`key` props** properly when rendering lists — ensure keys are stable and unique to avoid reconciliation issues and unnecessary re-renders.

## 9. Example Patterns to Include (Boilerplate)

You can use these as templates whenever you start a new component or custom hook.

````md
### 🧪 Example: Heavy list with filter & virtualization

```jsx
import { useState, useMemo, useCallback, startTransition } from 'react';

function ItemList({ items }) {
  const [filterText, setFilterText] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const onChange = (e) => {
    const val = e.target.value;
    setFilterText(val);
    startTransition(() => setSearchTerm(val));
  };

  const filtered = useMemo(() => items.filter((item) => item.name.includes(searchTerm)), [items, searchTerm]);

  const renderItem = useCallback((item) => <li key={item.id}>{item.name}</li>, []);

  return (
    <>
      <input value={filterText} onChange={onChange} placeholder="Filter items…" />
      <ul>{filtered.map(renderItem)}</ul>
    </>
  );
}
```
````

## 10. Summary & Mindset

- Build with **clarity first**, then optimize where necessary.
- Use React’s **modern hooks, concurrent features, and code-splitting** to keep UI responsive, bundle small, code clean.
- Favor **modular, declarative, reusable code** (custom hooks, small components, clear props).
- Use **profiling and metrics** to guide optimization — avoid premature or excessive memoization.

By following these practices, a React project becomes easier to maintain, perform well, and scale gracefully.

### File-Based API Module Pattern

- **Centralized API Functions:** All API requests must use dedicated API modules located in `/resources/js/apis/`. Never make direct `fetch()`, `axios()`, or similar calls in components or stores.
- **Module Structure:** Each API module should export functions for specific domain operations (e.g., `turfApi.searchTurfs()`, `userApi.updateProfile()`).

**Example API Module Structure:**

```typescript
// filepath: resources/js/apis/turf.ts
import api from './index';
import type { TurfSearchParams, TurfResponse, PaginatedResponse } from '@/types';

export const turfApi = {
  searchTurfs: (params: TurfSearchParams): Promise<PaginatedResponse<TurfResponse>> => api.get(route('api.turfs.search'), { params }),

  joinTurf: (turfId: number): Promise<{ success: boolean; message: string }> => api.post(route('api.turfs.join', { turf: turfId })),

  getTurfDetails: (turfId: number): Promise<TurfResponse> => api.get(route('api.turfs.show', { turf: turfId })),
};
```

**Usage in Components:**

```typescript
// ✅ Correct - Using API module
import { turfApi } from '@/apis/turf';

const handleJoinTurf = async (turfId: number) => {
  try {
    const result = await turfApi.joinTurf(turfId);
    // Handle success
  } catch (error) {
    // Handle error
  }
};
```

**Integration with Zustand:** API modules should be used within Zustand store actions to maintain consistency and enable proper error handling and state updates.

### TypeScript

- **Strong Typing:** Strive for strong typing everywhere. Avoid `any` as much as possible. Use specific types for props, state, API responses, and function signatures.
- **Interfaces vs. Types:** Use `interface` for defining the shape of objects and `type` for unions, intersections, or more complex type aliases.
- **Utility Types:** Leverage built-in utility types like `Partial`, `Required`, `Readonly`, `Pick`, `Omit` to create new types from existing ones.
- **Generics:** Use generics to create reusable components and functions that can work with a variety of types.

### Zustand

- **Modular Stores:** Create small, focused stores for different domains of your application state.
- **Selectors:** Use selectors (functions that derive data from the store state) to access and compute derived state in your components. This helps in optimizing re-renders.
- **Middleware:** Utilize Zustand middleware (e.g., `persist` for local storage, `devtools` for Redux DevTools integration, `immer` for immutable state updates) as needed.
- **Actions:** Define actions as functions within your store that encapsulate state update logic.
- **Features State** Define feature-specific state slices within your Zustand store. For example, have a `matchSessionStore` for match session-related state and actions.

### Laravel Inertia Ziggy Navigation

- **Use `route(routeName)` instead of hardcoded paths**
- **Prefer named routes in Laravel**
- **Ensure all navigable routes are named in Laravel**
- **Type-safe route parameters with Ziggy + TypeScript**

```tsx
route('user.profile', { id: user.id });
```

- **Avoid dynamic string route names**

* Don't do: `route('user.' + action)`
* Instead, use enums or clear constants.

- **Don’t mix Laravel redirects with Inertia navigation**
- - Use Inertia’s `<Link />` or `router.visit()` instead of `<a href>`.
- **Leverage `route().current()` to highlight active links**
- **Use `route().has()` to check if route exists before navigating**

### Ant Design

- **AntD components Customised:** use custom Ant Design components from `components/ui` or create new ones if needed.
- **Form Handling:** Leverage Ant Design's `Form` component for robust form handling, validation, and layout.
- **Accessibility:** Pay attention to Ant Design's accessibility features and ensure your usage aligns with WCAG guidelines.
- **Responsive Design:** Use Ant Design's grid and responsive utilities to create layouts that adapt to different screen sizes.

### TailwindCSS

- **Avoid custom CSS:** Rely on Tailwind's utility classes instead of writing custom CSS whenever possible. This keeps your styles consistent and easier to maintain.
- **Utility-First:** Embrace the utility-first approach. Apply small, single-purpose classes directly in your HTML/JSX.
- **`@apply` Sparingly:** Use `@apply` in CSS/SCSS files for component-level abstractions or to group common utility patterns, but avoid overusing it, as it can negate some benefits of utility-first.
- **Configuration:** Customize your `tailwind.config.ts` to define your project's design system (colors, spacing, fonts, etc.).
- **Readability:** For very long lists of utility classes, consider breaking components down further or using conditional class helpers to improve readability.
- **Responsive Design:** Use Tailwind's responsive utilities to create mobile-first designs. Use `sm:`, `md:`, `lg:`, etc., to apply styles at different breakpoints.
- **Dark Mode:** Use Tailwind's dark mode utilities to support dark mode. Ensure your design is accessible in both light and dark themes.

### @gsap/react

- **`useGSAP` Hook:** Always use the `useGSAP` hook for animations. It automatically handles cleanup, preventing memory leaks when components unmount.
- **Scope:** Use the `scope` property within `useGSAP` to target elements within your component without needing to create `useRef` for every single element. This is cleaner and more efficient.
- **`gsap.context()`:** For more complex scenarios or when not in a React component, `gsap.context()` provides a similar cleanup functionality to `useGSAP`.
- **Timeline:** Use `gsap.timeline()` for sequencing animations. It gives you precise control over the order and timing of animations.
- **Performance:** For animations on many elements, use `gsap.fromTo()` and consider using `gsap.quickSetter()` for performance-critical animations that update frequently (e.g., on mouse move). Avoid animating properties that cause layout reflows (like `width`, `height`, `top`, `left`) and prefer `transform` and `opacity`.
- **SSR:** Be mindful of Server-Side Rendering. GSAP is a client-side library, so ensure your GSAP-related code only runs on the client, for example by using `useEffect` or `useGSAP`.

### Workbox PWA

- **Vite PWA Plugin:** In a Vite project, use the `vite-plugin-pwa` to simplify Workbox integration.
- **Caching Strategies:**
  - `StaleWhileRevalidate`: Good for assets that can be a bit stale but should be fast to load, like user avatars or API responses that don't need to be real-time.
  - `CacheFirst`: Best for assets that never change, like fonts, logos, or versioned static assets.
  - `NetworkFirst`: For requests where having the most up-to-date data is crucial, like fetching an article's content.
  - `NetworkOnly`: For requests that should never be cached, like payment transactions.
- **Background Sync:** Use Workbox's `BackgroundSyncPlugin` to queue failed network requests (e.g., form submissions) and retry them when the network is available.
- **Precaching:** Precache your app shell (the minimal HTML, CSS, and JavaScript required to power the user interface) so the app loads reliably and instantly on subsequent visits.
- **Service Worker Lifecycle:** Understand the service worker lifecycle (`install`, `activate`, `fetch`). Use `skipWaiting()` and `clients.claim()` carefully to ensure new service workers activate quickly, but be aware of the implications for open tabs.

### date-fns

- **Clarity:** Prefer `date-fns` over the native `Date` object for more readable and less error-prone date manipulations.
- **Time Zones:** Be cautious with time zones; use libraries like `date-fns-tz` for handling time zones correctly if needed.
- **Format & Parse:** Prefer **format** and **parse** for date display and input.

### Code Style and Consistency

- **ESLint/Prettier**: Enforce code style using ESLint and Prettier.
- **Comments**: Write clear and concise comments for complex logic or non-obvious code.
- **DRY Principle**: Don't Repeat Yourself. Abstract reusable logic into functions, hooks, or components.
- **Add new Exposed Api Postman Doc** Document any new API endpoints or changes to existing ones in the postman Api collection file.
- **Page Naming Conventions**: follow Index, Show, Edit, Create conventions.

### Artisan CLI

- **Built-in Commands:** Familiarize yourself with common Artisan commands for tasks like migrations (`migrate`), seeding (`db:seed`), route listing (`route:list`), and generating boilerplate (`make:model`, `make:controller`, `make:migration`, etc.).
- **Custom Commands:** Create custom Artisan commands for repetitive tasks or application-specific operations. This improves developer efficiency and automates workflows.
- **Scheduling:** Use Laravel's Task Scheduling to run Artisan commands or other tasks periodically.

## Yarn (Berry)

- Run scripts with `yarn <script>`.
- Use `yarn dlx` for one-off tools.

### ⚛️ Inertia.js + React 📁 **Structure**

```plaintext
resources/
├─ js/
│  ├─ components/
│  |  ├─ ui/
│  |  ├─ features/
│  |  └─ layout/
│  ├─ css/
│  ├─ layouts/
│  ├─ pages/
│  ├─ stores/ ← Zustand logic
│  ├─ hooks/
│  |  ├─ teams/
│  |  └─ turf/
│  ├─ types/
│  └─ utils/
```

Visual Design UX

- Establish a clear visual hierarchy to guide user attention.
- Create intuitive navigation patterns.
- Provide clear calls-to-action to guide user behavior.

**General Tips:**

- Prioritize fetching data independently in components than relying on Laravel to pass all data through Inertia props.
- Write **unit and feature tests** for both backend and frontend.
- Use **ESLint** and **Prettier** for code consistency.
- Document components and APIs with **JSDoc** or PHPDoc.
- Use **GitHub Actions** or similar for CI/CD.
- Put theme mode into consideration and mobile friendliness for frontend ui/ux.
- Api documentation exists in the Postman collection file, ensure to check it when there is a need to call an API endpoint.
- write short code as possible, utilize short hand functions, avoid long lines of code, and use helper functions to break down complex logic.
- Avoid passing data with services on inertia pages controllers except for binded route resources, instead use api modules to fetch data in the components.
- Avoid generating useless files, components, or code that is not needed.
- Always keep user experience in mind, ensure that the application is easy to use, intuitive, and provides a smooth experience.
- Avoid passing hook value as prop to component, call the hook in the component instead.
- Avoid try catching controller methods not expected to throw 500 exceptions.

## Workflow

1. First think through the problem, read the codebase for relevant files, and write a plan to tasks/todo.md.
2. The plan should have a list of todo items that you can check off as you complete them
3. Before you begin working, check in with me and I will verify the plan.
4. Then, begin working on the todo items, marking them as complete as you go.
5. Make every task and code change you do as simple as possible. We want to avoid making any massive or complex changes. Every change should impact as little code as possible. Everything is about simplicity.
6. Be security concious. put security into consideration by making sure written codes follows security best practices. make sure there are no sensitive information in the front and and there are no vulnerabilities that can be exploited

===

<laravel-boost-guidelines>
=== foundation rules ===

# Laravel Boost Guidelines

The Laravel Boost guidelines are specifically curated by Laravel maintainers for this application. These guidelines should be followed closely to enhance the user's satisfaction building Laravel applications.

## Foundational Context

This application is a Laravel application and its main Laravel ecosystems package & versions are below. You are an expert with them all. Ensure you abide by these specific packages & versions.

- php - 8.4.5
- inertiajs/inertia-laravel (INERTIA) - v2
- laravel/framework (LARAVEL) - v12
- laravel/octane (OCTANE) - v2
- laravel/prompts (PROMPTS) - v0
- laravel/sanctum (SANCTUM) - v4
- laravel/telescope (TELESCOPE) - v5
- tightenco/ziggy (ZIGGY) - v2
- laravel/mcp (MCP) - v0
- laravel/pint (PINT) - v1
- laravel/sail (SAIL) - v1
- pestphp/pest (PEST) - v3
- phpunit/phpunit (PHPUNIT) - v11

## Conventions

- You must follow all existing code conventions used in this application. When creating or editing a file, check sibling files for the correct structure, approach, naming.
- Use descriptive names for variables and methods. For example, `isRegisteredForDiscounts`, not `discount()`.
- Check for existing components to reuse before writing a new one.

## Verification Scripts

- Do not create verification scripts or tinker when tests cover that functionality and prove it works. Unit and feature tests are more important.

## Application Structure & Architecture

- Stick to existing directory structure - don't create new base folders without approval.
- Do not change the application's dependencies without approval.

## Replies

- Be concise in your explanations - focus on what's important rather than explaining obvious details.

=== boost rules ===

## Laravel Boost

- Laravel Boost is an MCP server that comes with powerful tools designed specifically for this application. Use them.

## Artisan

- Use the `list-artisan-commands` tool when you need to call an Artisan command to double check the available parameters.

## URLs

- Whenever you share a project URL with the user you should use the `get-absolute-url` tool to ensure you're using the correct scheme, domain / IP, and port.

## Tinker / Debugging

- You should use the `tinker` tool when you need to execute PHP to debug code or query Eloquent models directly.
- Use the `database-query` tool when you only need to read from the database.

## Reading Browser Logs With the `browser-logs` Tool

- You can read browser logs, errors, and exceptions using the `browser-logs` tool from Boost.
- Only recent browser logs will be useful - ignore old logs.

## Searching Documentation (Critically Important)

- Boost comes with a powerful `search-docs` tool you should use before any other approaches. This tool automatically passes a list of installed packages and their versions to the remote Boost API, so it returns only version-specific documentation specific for the user's circumstance. You should pass an array of packages to filter on if you know you need docs for particular packages.
- The 'search-docs' tool is perfect for all Laravel related packages, including Laravel, Inertia, Livewire, Filament, Tailwind, Pest, Nova, Nightwatch, etc.
- You must use this tool to search for Laravel-ecosystem documentation before falling back to other approaches.
- Search the documentation before making code changes to ensure we are taking the correct approach.
- Use multiple, broad, simple, topic based queries to start. For example: `['rate limiting', 'routing rate limiting', 'routing']`.
- Do not add package names to queries - package information is already shared. For example, use `test resource table`, not `filament 4 test resource table`.

### Available Search Syntax

- You can and should pass multiple queries at once. The most relevant results will be returned first.

1. Simple Word Searches with auto-stemming - query=authentication - finds 'authenticate' and 'auth'
2. Multiple Words (AND Logic) - query=rate limit - finds knowledge containing both "rate" AND "limit"
3. Quoted Phrases (Exact Position) - query="infinite scroll" - Words must be adjacent and in that order
4. Mixed Queries - query=middleware "rate limit" - "middleware" AND exact phrase "rate limit"
5. Multiple Queries - queries=["authentication", "middleware"] - ANY of these terms

=== php rules ===

## PHP

- Always use curly braces for control structures, even if it has one line.

### Constructors

- Use PHP 8 constructor property promotion in `__construct()`.
  - <code-snippet>public function \_\_construct(public GitHub $github) { }</code-snippet>
- Do not allow empty `__construct()` methods with zero parameters.

### Type Declarations

- Always use explicit return type declarations for methods and functions.
- Use appropriate PHP type hints for method parameters.

<code-snippet name="Explicit Return Types and Method Params" lang="php">
protected function isAccessible(User $user, ?string $path = null): bool
{
    ...
}
</code-snippet>

## Comments

- Prefer PHPDoc blocks over comments. Never use comments within the code itself unless there is something _very_ complex going on.

## PHPDoc Blocks

- Add useful array shape type definitions for arrays when appropriate.

## Enums

- Typically, keys in an Enum should be TitleCase. For example: `FavoritePerson`, `BestLake`, `Monthly`.

=== inertia-laravel/core rules ===

## Inertia Core

- Inertia.js components should be placed in the `resources/js/Pages` directory unless specified differently in the JS bundler (vite.config.js).
- Use `Inertia::render()` for server-side routing instead of traditional Blade views.
- Use `search-docs` for accurate guidance on all things Inertia.

<code-snippet lang="php" name="Inertia::render Example">
// routes/web.php example
Route::get('/users', function () {
    return Inertia::render('Users/Index', [
        'users' => User::all()
    ]);
});
</code-snippet>

=== inertia-laravel/v2 rules ===

## Inertia v2

- Make use of all Inertia features from v1 & v2. Check the documentation before making any changes to ensure we are taking the correct approach.

### Inertia v2 New Features

- Polling
- Prefetching
- Deferred props
- Infinite scrolling using merging props and `WhenVisible`
- Lazy loading data on scroll

### Deferred Props & Empty States

- When using deferred props on the frontend, you should add a nice empty state with pulsing / animated skeleton.

### Inertia Form General Guidance

- Build forms using the `useForm` helper. Use the code examples and `search-docs` tool with a query of `useForm helper` for guidance.

=== laravel/core rules ===

## Do Things the Laravel Way

- Use `php artisan make:` commands to create new files (i.e. migrations, controllers, models, etc.). You can list available Artisan commands using the `list-artisan-commands` tool.
- If you're creating a generic PHP class, use `artisan make:class`.
- Pass `--no-interaction` to all Artisan commands to ensure they work without user input. You should also pass the correct `--options` to ensure correct behavior.

### Database

- Always use proper Eloquent relationship methods with return type hints. Prefer relationship methods over raw queries or manual joins.
- Use Eloquent models and relationships before suggesting raw database queries
- Avoid `DB::`; prefer `Model::query()`. Generate code that leverages Laravel's ORM capabilities rather than bypassing them.
- Generate code that prevents N+1 query problems by using eager loading.
- Use Laravel's query builder for very complex database operations.

### Model Creation

- When creating new models, create useful factories and seeders for them too. Ask the user if they need any other things, using `list-artisan-commands` to check the available options to `php artisan make:model`.

### APIs & Eloquent Resources

- For APIs, default to using Eloquent API Resources and API versioning unless existing API routes do not, then you should follow existing application convention.

### Queues

- Use queued jobs for time-consuming operations with the `ShouldQueue` interface.

### URL Generation

- When generating links to other pages, prefer named routes and the `route()` function.

### Configuration

- Use environment variables only in configuration files - never use the `env()` function directly outside of config files. Always use `config('app.name')`, not `env('APP_NAME')`.

### Testing

- When creating models for tests, use the factories for the models. Check if the factory has custom states that can be used before manually setting up the model.
- Faker: Use methods such as `$this->faker->word()` or `fake()->randomDigit()`. Follow existing conventions whether to use `$this->faker` or `fake()`.
- When creating tests, make use of `php artisan make:test [options] <name>` to create a feature test, and pass `--unit` to create a unit test. Most tests should be feature tests.

=== laravel/v12 rules ===

## Laravel 12

- Use the `search-docs` tool to get version specific documentation.

### Laravel 12 Structure

- No middleware files in `app/Http/Middleware/`.
- `bootstrap/app.php` is the file to register middleware, exceptions, and routing files.
- `bootstrap/providers.php` contains application specific service providers.
- **No app\Console\Kernel.php** - use `bootstrap/app.php` or `routes/console.php` for console configuration.
- **Commands auto-register** - files in `app/Console/Commands/` are automatically available and do not require manual registration.

### Database

- When modifying a column, the migration must include all of the attributes that were previously defined on the column. Otherwise, they will be dropped and lost.
- Laravel 11 allows limiting eagerly loaded records natively, without external packages: `$query->latest()->limit(10);`.

### Models

- Casts can and likely should be set in a `casts()` method on a model rather than the `$casts` property. Follow existing conventions from other models.

=== pint/core rules ===

## Laravel Pint Code Formatter

- You must run `vendor/bin/pint --dirty` before finalizing changes to ensure your code matches the project's expected style.
- Do not run `vendor/bin/pint --test`, simply run `vendor/bin/pint` to fix any formatting issues.

=== pest/core rules ===

## Pest

### Testing

- If you need to verify a feature is working, write or update a Unit / Feature test.

### Pest Tests

- All tests must be written using Pest. Use `php artisan make:test --pest <name>`.
- You must not remove any tests or test files from the tests directory without approval. These are not temporary or helper files - these are core to the application.
- Tests should test all of the happy paths, failure paths, and weird paths.
- Tests live in the `tests/Feature` and `tests/Unit` directories.
- Pest tests look and behave like this:
  <code-snippet name="Basic Pest Test Example" lang="php">
  it('is true', function () {
  expect(true)->toBeTrue();
  });
  </code-snippet>

### Running Tests

- Run the minimal number of tests using an appropriate filter before finalizing code edits.
- To run all tests: `php artisan test`.
- To run all tests in a file: `php artisan test tests/Feature/ExampleTest.php`.
- To filter on a particular test name: `php artisan test --filter=testName` (recommended after making a change to a related file).
- When the tests relating to your changes are passing, ask the user if they would like to run the entire test suite to ensure everything is still passing.

### Pest Assertions

- When asserting status codes on a response, use the specific method like `assertForbidden` and `assertNotFound` instead of using `assertStatus(403)` or similar, e.g.:
  <code-snippet name="Pest Example Asserting postJson Response" lang="php">
  it('returns all', function () {
  $response = $this->postJson('/api/docs', []);

      $response->assertSuccessful();

  });
  </code-snippet>

### Mocking

- Mocking can be very helpful when appropriate.
- When mocking, you can use the `Pest\Laravel\mock` Pest function, but always import it via `use function Pest\Laravel\mock;` before using it. Alternatively, you can use `$this->mock()` if existing tests do.
- You can also create partial mocks using the same import or self method.

### Datasets

- Use datasets in Pest to simplify tests which have a lot of duplicated data. This is often the case when testing validation rules, so consider going with this solution when writing tests for validation rules.

<code-snippet name="Pest Dataset Example" lang="php">
it('has emails', function (string $email) {
    expect($email)->not->toBeEmpty();
})->with([
    'james' => 'james@laravel.com',
    'taylor' => 'taylor@laravel.com',
]);
</code-snippet>

=== tests rules ===

## Test Enforcement

- Every change must be programmatically tested. Write a new test or update an existing test, then run the affected tests to make sure they pass.
- Run the minimum number of tests needed to ensure code quality and speed. Use `php artisan test` with a specific filename or filter.
  </laravel-boost-guidelines>
