# Contributing to MirSklada

Thank you for considering contributing to MirSklada! This document provides guidelines and instructions for contributing.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)
- [Testing Guidelines](#testing-guidelines)

## 📜 Code of Conduct

This project adheres to a professional code of conduct. Please be respectful and constructive in all interactions.

## 🚀 Getting Started

1. **Fork the repository**
2. **Clone your fork**
   ```bash
   git clone https://github.com/YOUR_USERNAME/mirsklada.git
   cd mirsklada
   ```
3. **Add upstream remote**
   ```bash
   git remote add upstream https://github.com/username/mirsklada.git
   ```
4. **Install dependencies**
   ```bash
   cd server && npm install
   cd ../client && npm install
   ```
5. **Create a branch**
   ```bash
   git checkout -b feature/IMS-001-your-feature-name
   ```

## 🔄 Development Workflow

### Branch Naming Convention

| Type | Pattern | Example |
|------|---------|---------|
| Feature | `feature/IMS-{ticket}-{description}` | `feature/IMS-001-user-authentication` |
| Bug Fix | `bugfix/IMS-{ticket}-{description}` | `bugfix/IMS-010-login-validation` |
| Hot Fix | `hotfix/IMS-{ticket}-{description}` | `hotfix/IMS-015-critical-db-fix` |
| Release | `release/v{version}` | `release/v1.0.0` |

### Workflow Steps

1. **Sync with upstream**
   ```bash
   git fetch upstream
   git checkout develop
   git merge upstream/develop
   ```

2. **Create feature branch**
   ```bash
   git checkout -b feature/IMS-XXX-description
   ```

3. **Make changes and commit**
   ```bash
   git add .
   git commit -m "feat(module): description"
   ```

4. **Push and create PR**
   ```bash
   git push origin feature/IMS-XXX-description
   ```

## 📝 Coding Standards

### JavaScript/Node.js

```javascript
// ✅ Good
const calculateTotal = async (items) => {
  const total = items.reduce((sum, item) => sum + item.price, 0);
  return total;
};

// ❌ Bad
function calculateTotal(items) {
  var total = 0;
  for (var i = 0; i < items.length; i++) {
    total = total + items[i].price;
  }
  return total;
}
```

### React Components

```jsx
// ✅ Good - Functional component with hooks
const ProductCard = ({ product, onEdit, onDelete }) => {
  const [isLoading, setIsLoading] = useState(false);
  
  const handleDelete = async () => {
    setIsLoading(true);
    await onDelete(product.id);
    setIsLoading(false);
  };

  return (
    <div className="product-card">
      <h3>{product.name}</h3>
      <button onClick={handleDelete} disabled={isLoading}>
        Delete
      </button>
    </div>
  );
};

export default ProductCard;
```

### Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Variables | camelCase | `productName`, `totalAmount` |
| Functions | camelCase | `calculateTotal()`, `getClientDebt()` |
| React Components | PascalCase | `ProductCard`, `OrderList` |
| Constants | SCREAMING_SNAKE | `MAX_RETRY_COUNT`, `API_BASE_URL` |
| Database tables | snake_case | `order_items`, `client_payments` |
| API endpoints | kebab-case | `/api/v1/client-prices` |
| CSS classes | kebab-case | `product-card`, `order-list` |

### File Structure

```
// Feature module structure
modules/
└── products/
    ├── products.controller.js   # HTTP request handlers
    ├── products.service.js      # Business logic
    ├── products.routes.js       # Route definitions
    ├── products.validation.js   # Input validation schemas
    └── products.test.js         # Unit tests
```

## 📝 Commit Guidelines

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

### Types

| Type | Description |
|------|-------------|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation changes |
| `style` | Formatting (no code change) |
| `refactor` | Code restructuring |
| `test` | Adding/updating tests |
| `chore` | Maintenance tasks |

### Scopes

`auth`, `products`, `suppliers`, `clients`, `orders`, `purchases`, `payments`, `reports`, `telegram`, `ui`, `db`, `api`

### Examples

```bash
feat(products): add multiple unit support
fix(orders): correct price calculation for bulk orders
docs(api): update endpoint documentation
test(auth): add unit tests for login service
refactor(clients): extract debt calculation to service
chore(deps): upgrade express to v4.18.2
```

## 🔀 Pull Request Process

1. **Fill out the PR template completely**
2. **Ensure all checks pass** (tests, linting, build)
3. **Request review** from maintainers
4. **Address feedback** promptly
5. **Keep PR focused** - one feature/fix per PR

### PR Checklist

- [ ] Code follows project coding standards
- [ ] Self-review completed
- [ ] Comments added for complex logic
- [ ] Documentation updated (if applicable)
- [ ] Tests added/updated
- [ ] All tests passing locally
- [ ] No new warnings or errors
- [ ] CHANGELOG updated (for features)

## 🧪 Testing Guidelines

### Backend Tests (Jest)

```javascript
describe('ProductService', () => {
  describe('getProductById', () => {
    it('should return product when found', async () => {
      // Arrange
      const mockProduct = { id: 1, name: 'Test' };
      
      // Act
      const result = await productService.getById(1);
      
      // Assert
      expect(result).toEqual(mockProduct);
    });

    it('should throw error when product not found', async () => {
      await expect(productService.getById(999))
        .rejects.toThrow('Product not found');
    });
  });
});
```

### Frontend Tests (Vitest + RTL)

```jsx
import { render, screen, fireEvent } from '@testing-library/react';
import ProductCard from './ProductCard';

describe('ProductCard', () => {
  it('should render product name', () => {
    render(<ProductCard product={{ name: 'Test Product' }} />);
    expect(screen.getByText('Test Product')).toBeInTheDocument();
  });

  it('should call onDelete when delete button clicked', () => {
    const onDelete = vi.fn();
    render(<ProductCard product={{ id: 1 }} onDelete={onDelete} />);
    
    fireEvent.click(screen.getByRole('button', { name: /delete/i }));
    
    expect(onDelete).toHaveBeenCalledWith(1);
  });
});
```

### Running Tests

```bash
# Backend
cd server
npm test                    # Run all tests
npm run test:watch          # Watch mode
npm run test:coverage       # With coverage report

# Frontend
cd client
npm test                    # Run all tests
npm run test:coverage       # With coverage report
```

## 📞 Questions?

If you have questions, please:
1. Check existing documentation
2. Search existing issues
3. Create a new issue with the question label

---

Thank you for contributing to MirSklada! 🙏
