# Implementation Guides

This directory contains step-by-step implementation guides for the Todo App features, based on the PRPs (Product Requirement Prompts).

## Available Guides

### [Calendar View Implementation Guide](./calendar-view-implementation-guide.md)
**Status**: ✅ Ready for Implementation  
**Based on**: PRP 10 - Calendar View  
**Estimated Time**: 2-3 days (17-24 hours)  
**Dependencies**: PRP 01, 02, 11

Complete step-by-step guide for implementing the monthly calendar visualization feature with Singapore holidays.

**Includes**:
- Database setup (holidays table, seed script)
- API layer (GET /api/holidays)
- Calendar page implementation (React components)
- Calendar grid generation logic
- Styling and accessibility
- E2E testing strategy
- Deployment considerations

---

## How to Use These Guides

1. **Read the corresponding PRP** first to understand the feature requirements
2. **Follow the implementation guide** step-by-step
3. **Test each phase** before moving to the next
4. **Verify acceptance criteria** at the end

## Guide Structure

Each implementation guide follows this structure:

1. **Overview** - Feature summary and key capabilities
2. **Prerequisites** - Dependencies and required features
3. **Implementation Phases** - High-level phases with time estimates
4. **Detailed Step-by-Step Guide** - Code examples and instructions
5. **Testing Strategy** - Unit tests, E2E tests, manual testing
6. **Deployment Considerations** - Production readiness checklist
7. **Troubleshooting** - Common issues and solutions
8. **Acceptance Criteria** - Verification checklist

## Creating New Implementation Guides

When creating a new implementation guide:

1. Use the calendar view guide as a template
2. Reference the corresponding PRP document
3. Include complete code examples
4. Provide clear phase breakdown with time estimates
5. Include comprehensive testing strategy
6. Document common pitfalls and solutions
7. List all acceptance criteria from the PRP

## Related Documentation

- **PRPs**: [../PRPs/](../PRPs/) - Architecture specifications
- **User Guide**: [../USER_GUIDE.md](../USER_GUIDE.md) - End-user documentation
- **README**: [../README.md](../README.md) - Setup and installation
- **Evaluation**: [../EVALUATION.md](../EVALUATION.md) - Feature completeness checklist

---

**Last Updated**: 2026-02-06  
**Total Guides**: 1  
**Status**: 🟢 Active
