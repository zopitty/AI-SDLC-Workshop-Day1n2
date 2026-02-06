# Implementation Examples

This directory contains example implementation code demonstrating how to build features based on the PRPs (Product Requirement Prompts).

## 📁 Directory Structure

```
examples/
└── recurring-todos/          # PRP 03: Recurring Todos implementation
    ├── lib/                  # Utilities and types
    ├── components/           # React components
    ├── api/                  # API route logic
    ├── tests/                # Unit tests
    └── README.md             # Detailed documentation
```

## 🎯 Purpose

These examples serve as:

1. **Reference implementations** - Show how to translate PRP specifications into working code
2. **Learning resources** - Help developers understand the architecture patterns
3. **Starting templates** - Provide copy-paste code for new features
4. **Testing guides** - Demonstrate comprehensive test coverage

## 📚 Available Examples

### Recurring Todos (PRP 03)
**Status**: ✅ Complete  
**Files**: 7 (lib, components, API, tests, docs)  
**Features**:
- Date calculation with edge case handling (month-end, leap years)
- React components (RecurrenceBadge, RecurrenceSelector)
- API completion logic with next instance creation
- Comprehensive unit tests (12+ test cases)

**See**: [recurring-todos/README.md](recurring-todos/README.md)

## 🚀 How to Use

### Option 1: Copy to Your Project

```bash
# Copy the entire feature implementation
cp -r examples/recurring-todos/lib/* your-project/lib/
cp -r examples/recurring-todos/components/* your-project/components/
cp -r examples/recurring-todos/tests/* your-project/tests/
```

### Option 2: Reference for Implementation

1. Read the PRP document (e.g., `/PRPs/03-recurring-todos.md`)
2. Review the example implementation
3. Implement in your own style following the patterns
4. Use the tests as validation

### Option 3: AI-Assisted Development

```
@workspace I want to implement [feature name].
Please reference:
- Architecture: /PRPs/[XX]-[feature-name].md
- Example: /examples/[feature-name]/

Follow the patterns from the example but adapt to our codebase.
```

## 📋 Example Structure Pattern

Each example follows this structure:

```
feature-name/
├── lib/                      # Business logic and utilities
│   ├── types.ts             # TypeScript interfaces
│   ├── db-types.ts          # Database schema and types
│   └── [feature].ts         # Core logic
├── components/               # React components
│   └── [Component].tsx      # UI components
├── api/                      # API route logic
│   └── [endpoint].ts        # Request handlers
├── tests/                    # Test files
│   └── [feature].test.ts    # Unit/integration tests
└── README.md                # Detailed documentation
```

## 🎓 Learning Path

For developers new to the project:

1. **Start with PRP 01** (Todo CRUD) - Foundation
2. **Review PRP 03 example** - More complex feature
3. **Read `.github/copilot-instructions.md`** - Project patterns
4. **Study test files** - Testing approach

## ✅ Code Quality Standards

All examples follow:

- ✅ **TypeScript strict mode** - Full type safety
- ✅ **Accessibility** - ARIA labels, keyboard navigation
- ✅ **Error handling** - Comprehensive edge cases
- ✅ **Documentation** - JSDoc comments, inline explanations
- ✅ **Testing** - Unit tests with 80%+ coverage
- ✅ **Best practices** - Following project conventions

## 🔗 Related Resources

- **PRPs Directory**: `/PRPs/` - Feature specifications
- **Architecture**: `/PRPs/ARCHITECTURE.md` - System overview
- **Project Instructions**: `/.github/copilot-instructions.md` - Coding standards
- **User Guide**: `/USER_GUIDE.md` - End-user documentation

## 🛠️ Contributing Examples

To add a new example:

1. Create directory: `examples/[feature-name]/`
2. Follow the standard structure (lib/, components/, api/, tests/)
3. Include comprehensive README.md
4. Reference the corresponding PRP document
5. Add unit tests with good coverage
6. Update this index file

## 📊 Examples Roadmap

Planned examples (based on PRP priority):

- [x] **PRP 03**: Recurring Todos ✅
- [ ] **PRP 05**: Subtasks & Progress Tracking
- [ ] **PRP 06**: Tag System
- [ ] **PRP 07**: Template System
- [ ] **PRP 09**: Export/Import

## 💡 Tips

1. **Always read the PRP first** - Understand the "why" before the "how"
2. **Test the examples** - Run the tests to see expected behavior
3. **Adapt, don't just copy** - Understand the patterns and apply them
4. **Check dependencies** - Some features require others (see PRP README)

## 📞 Support

Questions? Check:
- PRP document for the feature
- Example README.md
- `.github/copilot-instructions.md` for project patterns
- `USER_GUIDE.md` for user-facing behavior

---

**Created**: 2026-02-06  
**Status**: Active development  
**Examples**: 1 (Recurring Todos)
