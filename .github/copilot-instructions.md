## 🧱 Copilot Instruction Guide for Full-Stack (Laravel + Inertia.js + React + TS)

### Laravel

- **Eloquent ORM:**
    - Use `findOrFail()` or `firstOrFail()` to automatically handle "not found" scenarios.
    - Utilize Eager Loading (`with()`) to prevent N+1 query problems.
    - Define clear relationships in your models.
    - Use API Resources for transforming models and collections before sending them to the frontend, ensuring a consistent API structure.
- **Routing:** Group related routes and use route model binding. Name your routes for easier URL generation.
- **Form Requests:** Use Form Request classes for validation and authorization of incoming requests. This keeps controllers lean.
- **Services:** consider using Service classes for encapsulating domain-specific business logic. This promotes single responsibility and reusability.
- **Configuration:** Use .env files for environment-specific configuration and access them via the `config()` helper.
- **Eloquent Relationships & Query Scopes:** Use Eloquent relationships and query scopes for reusable queries.
- **Type Hinting & Return Types:** Use **type-hinting** and **return types** in all methods.
- **Utilizing Observers and Events:** Leverage Laravel's model observers and events when needed for handling actions that require another action to be taken in another context.

### Inertia.js

- **Data Props:** Be selective about the data you pass from Laravel controllers to Inertia pages. Only pass what's necessary for the initial page load.
- **`usePage` Hook:** Access shared data and props in your React components using the `usePage().props` hook.
- **Partial Reloads:** Utilize partial reloads (`only` and `except` options) to optimize data fetching when only a portion of the page's data needs to be updated.
- **`remember`:** Use Inertia's `remember` functionality for preserving component state across page visits, especially for form inputs or filters.
- **Error Handling:** Use Inertia's error handling (`$page.props.errors`) to display validation errors from Laravel.
- **Routing:** Use Inertia's `<Link>` component or `router.visit()` for client-side navigation.
- **Shared Props:** Use **shared props** for global data (e.g., user, flash messages).

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
- **Inertia Controller:**

    ```php
    // filepath: app/Http/Controllers/Web/ProductController.php
    use App\Http\Resources\ProductResource;
    use App\Services\ProductService;
    use Inertia\Inertia;
    use Inertia\Response;

    class ProductController extends Controller
    {
        protected ProductService $productService;

        public function __construct(ProductService $productService)
        {
            $this->productService = $productService;
        }

        public function index(): Response
        {
            $products = $this->productService->getActiveProducts();
            return Inertia::render('Products/Index', [
                'products' => ProductResource::collection($products),
            ]);
        }
    }
    ```

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

### React

- **Functional Components & Hooks:** Embrace functional components and hooks (`useState`, `useEffect`, `useContext`, `useMemo`, `useCallback`) for managing state and side effects.
- **Component Composition:** Break down UI into small, reusable components. Favor composition over inheritance.
- **Props:** Keep props minimal and clearly defined. Use TypeScript interfaces for prop types.
- **State Management:** For local component state, `useState` is often sufficient. For more complex, shared state, use Zustand.
- **Memoization:** Use `React.memo` for components and `useMemo`/`useCallback` for functions and values to prevent unnecessary re-renders, but only after profiling and identifying performance bottlenecks.
- **Component State Encapsulation:** Keep component state encapsulated. Avoid lifting state up unless necessary.

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
-   - Use Inertia’s `<Link />` or `router.visit()` instead of `<a href>`.
- **Leverage `route().current()` to highlight active links**
- **Use `route().has()` to check if route exists before navigating**

### Ant Design

- **Theme Customization:** Use Ant Design's theming capabilities (e.g., via `ConfigProvider` or by customizing Less variables if you've set up Less) to match your application's branding.
- **Form Handling:** Leverage Ant Design's `Form` component for robust form handling, validation, and layout.
- **Accessibility:** Pay attention to Ant Design's accessibility features and ensure your usage aligns with WCAG guidelines.

### TailwindCSS

- **Utility-First:** Embrace the utility-first approach. Apply small, single-purpose classes directly in your HTML/JSX.
- **`@apply` Sparingly:** Use `@apply` in CSS/SCSS files for component-level abstractions or to group common utility patterns, but avoid overusing it, as it can negate some benefits of utility-first.
- **Configuration:** Customize your `tailwind.config.ts` to define your project's design system (colors, spacing, fonts, etc.).
- **Readability:** For very long lists of utility classes, consider breaking components down further or using conditional class helpers to improve readability.

### date-fns

- **Clarity:** Prefer `date-fns` over the native `Date` object for more readable and less error-prone date manipulations.
- **Time Zones:** Be cautious with time zones; use libraries like `date-fns-tz` for handling time zones correctly if needed.
- **Format & Parse:** Prefer **format** and **parse** for date display and input.

### Code Style and Consistency

- **ESLint/Prettier**: Enforce code style using ESLint and Prettier. Configure them to work together.
- **Comments**: Write clear and concise comments for complex logic or non-obvious code.
- **DRY Principle**: Don't Repeat Yourself. Abstract reusable logic into functions, hooks, or components.

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
│  ├─ css/
│  ├─ layouts/
│  ├─ pages/
│  ├─ stores/ ← Zustand logic
│  ├─ hooks/
│  ├─ types/
│  └─ utils/
```

**General Tips:**

- Write **unit and feature tests** for both backend and frontend.
- Use **ESLint** and **Prettier** for code consistency.
- Document components and APIs with **JSDoc** or PHPDoc.
- Use **GitHub Actions** or similar for CI/CD.
