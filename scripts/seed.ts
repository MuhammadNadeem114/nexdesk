import { db } from "../src/lib/db.ts";

const now = new Date();
const daysAgo = (d: number) => new Date(now.getTime() - d * 86400000);
const daysFromNow = (d: number) => new Date(now.getTime() + d * 86400000);
const hoursAgo = (h: number) => new Date(now.getTime() - h * 3600000);

async function seed() {
  console.log("🌱 Seeding database...\n");

  // Clean existing data (order matters for FK constraints)
  await db.message.deleteMany();
  await db.channelMember.deleteMany();
  await db.channel.deleteMany();
  await db.taskLabel.deleteMany();
  await db.taskComment.deleteMany();
  await db.taskAttachment.deleteMany();
  await db.taskHistory.deleteMany();
  await db.task.deleteMany();
  await db.projectMember.deleteMany();
  await db.teamMember.deleteMany();
  await db.meetingAttendee.deleteMany();
  await db.meeting.deleteMany();
  await db.file.deleteMany();
  await db.folder.deleteMany();
  await db.aiMessage.deleteMany();
  await db.aiConversation.deleteMany();
  await db.notification.deleteMany();
  await db.invoice.deleteMany();
  await db.subscription.deleteMany();
  await db.auditLog.deleteMany();
  await db.activityLog.deleteMany();
  await db.userSetting.deleteMany();
  await db.orgSetting.deleteMany();
  await db.apiKey.deleteMany();
  await db.orgMember.deleteMany();
  await db.project.deleteMany();
  await db.team.deleteMany();
  await db.organization.deleteMany();
  await db.user.deleteMany();

  console.log("✅ Cleaned existing data");

  // ══════════════════════════════════════════
  // 1. ORGANIZATION
  // ══════════════════════════════════════════
  const org = await db.organization.create({
    data: {
      name: "NexDesk Corp",
      slug: "nexdesk-corp",
      logo: "https://ui-avatars.com/api/?name=NC&background=6366f1&color=fff&size=128&bold=true",
      description:
        "A modern workspace platform that brings teams together with project management, real-time communication, and AI-powered productivity tools.",
      plan: "pro",
      maxMembers: 50,
    },
  });
  console.log(`🏢 Created organization: ${org.name}`);

  // ══════════════════════════════════════════
  // 2. USERS
  // ══════════════════════════════════════════
  const usersData = [
    {
      email: "alex@nexdesk.com",
      name: "Alex Chen",
      jobTitle: "CEO & Co-Founder",
      department: "Executive",
      avatar:
        "https://ui-avatars.com/api/?name=Alex+Chen&background=6366f1&color=fff",
      bio: "Passionate about building tools that empower teams to do their best work.",
    },
    {
      email: "sarah@nexdesk.com",
      name: "Sarah Mitchell",
      jobTitle: "VP of Engineering",
      department: "Engineering",
      avatar:
        "https://ui-avatars.com/api/?name=Sarah+Mitchell&background=ec4899&color=fff",
      bio: "Full-stack engineer turned engineering leader. 12+ years in SaaS.",
    },
    {
      email: "marcus@nexdesk.com",
      name: "Marcus Johnson",
      jobTitle: "Senior Frontend Engineer",
      department: "Engineering",
      avatar:
        "https://ui-avatars.com/api/?name=Marcus+Johnson&background=3b82f6&color=fff",
      bio: "React & TypeScript enthusiast. Building beautiful interfaces.",
    },
    {
      email: "emily@nexdesk.com",
      name: "Emily Rodriguez",
      jobTitle: "Lead Product Designer",
      department: "Design",
      avatar:
        "https://ui-avatars.com/api/?name=Emily+Rodriguez&background=f59e0b&color=fff",
      bio: "Design systems advocate. Making complex things simple.",
    },
    {
      email: "david@nexdesk.com",
      name: "David Kim",
      jobTitle: "Backend Engineer",
      department: "Engineering",
      avatar:
        "https://ui-avatars.com/api/?name=David+Kim&background=10b981&color=fff",
      bio: "Distributed systems, APIs, and all things backend.",
    },
    {
      email: "lisa@nexdesk.com",
      name: "Lisa Wang",
      jobTitle: "Head of Marketing",
      department: "Marketing",
      avatar:
        "https://ui-avatars.com/api/?name=Lisa+Wang&background=8b5cf6&color=fff",
      bio: "Growth marketer with a data-driven approach.",
    },
    {
      email: "james@nexdesk.com",
      name: "James Park",
      jobTitle: "Full Stack Developer",
      department: "Engineering",
      avatar:
        "https://ui-avatars.com/api/?name=James+Park&background=ef4444&color=fff",
      bio: "Node.js & React developer. Open source contributor.",
    },
    {
      email: "nina@nexdesk.com",
      name: "Nina Patel",
      jobTitle: "UX Researcher",
      department: "Design",
      avatar:
        "https://ui-avatars.com/api/?name=Nina+Patel&background=06b6d4&color=fff",
      bio: "Understanding users through research and empathy.",
    },
  ];

  const users = [];
  for (const u of usersData) {
    const user = await db.user.create({
      data: {
        ...u,
        passwordHash: "hashed_password_demo",
        isActive: true,
        emailVerified: true,
        lastLoginAt: hoursAgo(Math.floor(Math.random() * 48) + 1),
      },
    });
    users.push(user);
  }
  console.log(`👥 Created ${users.length} users`);

  // ══════════════════════════════════════════
  // 3. ORG MEMBERS
  // ══════════════════════════════════════════
  const orgRoles = [
    "ORG_OWNER",
    "MANAGER",
    "EMPLOYEE",
    "EMPLOYEE",
    "EMPLOYEE",
    "EMPLOYEE",
    "EMPLOYEE",
    "EMPLOYEE",
  ];
  for (let i = 0; i < users.length; i++) {
    await db.orgMember.create({
      data: {
        userId: users[i].id,
        organizationId: org.id,
        role: orgRoles[i],
        joinedAt: daysAgo(90 - i * 5),
      },
    });
  }
  console.log("🔗 Created org memberships");

  // ══════════════════════════════════════════
  // 4. USER SETTINGS
  // ══════════════════════════════════════════
  const themes = ["dark", "light", "system", "dark", "system", "light", "dark", "system"];
  for (let i = 0; i < users.length; i++) {
    await db.userSetting.create({
      data: {
        userId: users[i].id,
        theme: themes[i],
        language: "en",
        sidebarCollapsed: i === 5,
      },
    });
  }
  console.log("⚙️ Created user settings");

  // ══════════════════════════════════════════
  // 5. TEAMS
  // ══════════════════════════════════════════
  const teams = await Promise.all([
    db.team.create({
      data: {
        name: "Engineering",
        description: "Core product engineering team responsible for building and maintaining the platform.",
        color: "#3b82f6",
        organizationId: org.id,
      },
    }),
    db.team.create({
      data: {
        name: "Design",
        description: "Product design team focused on user experience and visual design.",
        color: "#f59e0b",
        organizationId: org.id,
      },
    }),
    db.team.create({
      data: {
        name: "Marketing",
        description: "Marketing team driving growth, brand awareness, and content strategy.",
        color: "#8b5cf6",
        organizationId: org.id,
      },
    }),
  ]);
  console.log(`🏷️ Created ${teams.length} teams`);

  // Team members
  // Engineering: Alex (LEAD), Sarah (LEAD), Marcus, David, James
  const engineeringTeamMembers = [
    { userId: users[0].id, role: "LEAD" },
    { userId: users[1].id, role: "LEAD" },
    { userId: users[2].id, role: "MEMBER" },
    { userId: users[4].id, role: "MEMBER" },
    { userId: users[6].id, role: "MEMBER" },
  ];
  // Design: Emily (LEAD), Nina
  const designTeamMembers = [
    { userId: users[3].id, role: "LEAD" },
    { userId: users[7].id, role: "MEMBER" },
  ];
  // Marketing: Lisa (LEAD), Alex
  const marketingTeamMembers = [
    { userId: users[5].id, role: "LEAD" },
    { userId: users[0].id, role: "MEMBER" },
  ];

  const allTeamMembers = [
    ...engineeringTeamMembers.map((m) => ({ ...m, teamId: teams[0].id })),
    ...designTeamMembers.map((m) => ({ ...m, teamId: teams[1].id })),
    ...marketingTeamMembers.map((m) => ({ ...m, teamId: teams[2].id })),
  ];

  for (const tm of allTeamMembers) {
    await db.teamMember.create({
      data: { userId: tm.userId, teamId: tm.teamId, role: tm.role },
    });
  }
  console.log("👥 Created team memberships");

  // ══════════════════════════════════════════
  // 6. PROJECTS
  // ══════════════════════════════════════════
  const projectsData = [
    {
      name: "NexDesk Platform v2.0",
      description:
        "Major platform upgrade with new UI, improved performance, and enhanced collaboration features.",
      status: "ACTIVE",
      color: "#6366f1",
      icon: "🚀",
      startDate: daysAgo(45),
      endDate: daysFromNow(60),
      progress: 65,
      creatorId: users[0].id,
    },
    {
      name: "Mobile App",
      description:
        "Native mobile application for iOS and Android with offline support and push notifications.",
      status: "ACTIVE",
      color: "#3b82f6",
      icon: "📱",
      startDate: daysAgo(30),
      endDate: daysFromNow(90),
      progress: 25,
      creatorId: users[1].id,
    },
    {
      name: "Website Redesign",
      description:
        "Complete redesign of the marketing website with new branding, case studies, and improved conversion flows.",
      status: "ACTIVE",
      color: "#ec4899",
      icon: "🎨",
      startDate: daysAgo(20),
      endDate: daysFromNow(40),
      progress: 45,
      creatorId: users[5].id,
    },
    {
      name: "AI Integration",
      description:
        "Integrate AI capabilities including smart suggestions, automated task routing, and natural language queries.",
      status: "PAUSED",
      color: "#10b981",
      icon: "🤖",
      startDate: daysAgo(60),
      endDate: daysFromNow(30),
      progress: 40,
      creatorId: users[4].id,
    },
    {
      name: "API Gateway",
      description:
        "Build a robust API gateway for third-party integrations with rate limiting, auth, and developer documentation.",
      status: "COMPLETED",
      color: "#f59e0b",
      icon: "🔌",
      startDate: daysAgo(90),
      endDate: daysAgo(10),
      progress: 100,
      creatorId: users[4].id,
    },
    {
      name: "Analytics Dashboard",
      description:
        "Real-time analytics dashboard with custom reports, data visualizations, and export capabilities.",
      status: "ACTIVE",
      color: "#8b5cf6",
      icon: "📊",
      startDate: daysAgo(15),
      endDate: daysFromNow(75),
      progress: 10,
      creatorId: users[2].id,
    },
  ];

  const projects = [];
  for (const p of projectsData) {
    const project = await db.project.create({
      data: { ...p, organizationId: org.id },
    });
    projects.push(project);
  }
  console.log(`📁 Created ${projects.length} projects`);

  // Project members
  const projectMemberships = [
    // NexDesk Platform v2.0 - everyone involved
    { userId: users[0].id, projectId: projects[0].id, role: "OWNER" },
    { userId: users[1].id, projectId: projects[0].id, role: "MANAGER" },
    { userId: users[2].id, projectId: projects[0].id, role: "MEMBER" },
    { userId: users[3].id, projectId: projects[0].id, role: "MEMBER" },
    { userId: users[4].id, projectId: projects[0].id, role: "MEMBER" },
    { userId: users[6].id, projectId: projects[0].id, role: "MEMBER" },
    // Mobile App
    { userId: users[1].id, projectId: projects[1].id, role: "OWNER" },
    { userId: users[2].id, projectId: projects[1].id, role: "MANAGER" },
    { userId: users[4].id, projectId: projects[1].id, role: "MEMBER" },
    { userId: users[6].id, projectId: projects[1].id, role: "MEMBER" },
    // Website Redesign
    { userId: users[5].id, projectId: projects[2].id, role: "OWNER" },
    { userId: users[3].id, projectId: projects[2].id, role: "MANAGER" },
    { userId: users[7].id, projectId: projects[2].id, role: "MEMBER" },
    // AI Integration
    { userId: users[4].id, projectId: projects[3].id, role: "OWNER" },
    { userId: users[1].id, projectId: projects[3].id, role: "MANAGER" },
    { userId: users[6].id, projectId: projects[3].id, role: "MEMBER" },
    // API Gateway
    { userId: users[4].id, projectId: projects[4].id, role: "OWNER" },
    { userId: users[1].id, projectId: projects[4].id, role: "MANAGER" },
    { userId: users[6].id, projectId: projects[4].id, role: "MEMBER" },
    // Analytics Dashboard
    { userId: users[2].id, projectId: projects[5].id, role: "OWNER" },
    { userId: users[0].id, projectId: projects[5].id, role: "VIEWER" },
    { userId: users[5].id, projectId: projects[5].id, role: "MEMBER" },
  ];

  for (const pm of projectMemberships) {
    await db.projectMember.create({ data: pm });
  }
  console.log("👥 Created project memberships");

  // ══════════════════════════════════════════
  // 7. TASKS (~30 tasks)
  // ══════════════════════════════════════════
  const tasksData = [
    // Project 0: NexDesk Platform v2.0
    {
      title: "Design new navigation system",
      description:
        "Create wireframes and high-fidelity designs for the updated sidebar navigation with collapsible sections and quick search.",
      status: "DONE",
      priority: "HIGH",
      order: 0,
      projectId: projects[0].id,
      assigneeId: users[3].id,
      creatorId: users[1].id,
      dueDate: daysAgo(20),
      estimateHours: 16,
      loggedHours: 14,
      startDate: daysAgo(40),
    },
    {
      title: "Implement real-time collaboration engine",
      description:
        "Build WebSocket-based real-time sync for documents, tasks, and project boards using CRDTs.",
      status: "IN_PROGRESS",
      priority: "URGENT",
      order: 1,
      projectId: projects[0].id,
      assigneeId: users[4].id,
      creatorId: users[1].id,
      dueDate: daysFromNow(14),
      estimateHours: 40,
      loggedHours: 22,
      startDate: daysAgo(14),
    },
    {
      title: "Migrate database to support multi-tenancy",
      description:
        "Update schema and queries to properly isolate data per organization with row-level security.",
      status: "IN_PROGRESS",
      priority: "HIGH",
      order: 2,
      projectId: projects[0].id,
      assigneeId: users[4].id,
      creatorId: users[0].id,
      dueDate: daysFromNow(21),
      estimateHours: 24,
      loggedHours: 10,
      startDate: daysAgo(10),
    },
    {
      title: "Build notification preferences UI",
      description:
        "Create settings panel for users to manage notification channels (email, push, in-app) and frequency.",
      status: "TODO",
      priority: "MEDIUM",
      order: 3,
      projectId: projects[0].id,
      assigneeId: users[2].id,
      creatorId: users[3].id,
      dueDate: daysFromNow(30),
      estimateHours: 8,
      loggedHours: 0,
    },
    {
      title: "Set up E2E testing framework",
      description:
        "Configure Playwright for end-to-end tests with CI integration and coverage reporting.",
      status: "BACKLOG",
      priority: "MEDIUM",
      order: 4,
      projectId: projects[0].id,
      assigneeId: users[6].id,
      creatorId: users[1].id,
      estimateHours: 12,
      loggedHours: 0,
    },
    {
      title: "Implement dark mode toggle",
      description:
        "Add system-aware and manual dark mode support with smooth theme transitions.",
      status: "DONE",
      priority: "LOW",
      order: 5,
      projectId: projects[0].id,
      assigneeId: users[2].id,
      creatorId: users[3].id,
      dueDate: daysAgo(10),
      estimateHours: 6,
      loggedHours: 7,
      startDate: daysAgo(20),
    },

    // Project 1: Mobile App
    {
      title: "Set up React Native project structure",
      description:
        "Initialize React Native project with TypeScript, navigation, and state management libraries.",
      status: "DONE",
      priority: "HIGH",
      order: 0,
      projectId: projects[1].id,
      assigneeId: users[6].id,
      creatorId: users[1].id,
      dueDate: daysAgo(15),
      estimateHours: 8,
      loggedHours: 6,
      startDate: daysAgo(28),
    },
    {
      title: "Build authentication flow",
      description:
        "Implement login, registration, SSO, and biometric authentication screens.",
      status: "IN_PROGRESS",
      priority: "URGENT",
      order: 1,
      projectId: projects[1].id,
      assigneeId: users[2].id,
      creatorId: users[1].id,
      dueDate: daysFromNow(7),
      estimateHours: 20,
      loggedHours: 12,
      startDate: daysAgo(12),
    },
    {
      title: "Implement push notification service",
      description:
        "Configure FCM/APNs for push notifications with deep linking and rich notification support.",
      status: "TODO",
      priority: "HIGH",
      order: 2,
      projectId: projects[1].id,
      assigneeId: users[4].id,
      creatorId: users[2].id,
      dueDate: daysFromNow(21),
      estimateHours: 16,
      loggedHours: 0,
    },
    {
      title: "Design mobile UI components",
      description:
        "Create a mobile-first component library consistent with the NexDesk design system.",
      status: "IN_REVIEW",
      priority: "MEDIUM",
      order: 3,
      projectId: projects[1].id,
      assigneeId: users[3].id,
      creatorId: users[1].id,
      dueDate: daysAgo(2),
      estimateHours: 24,
      loggedHours: 22,
      startDate: daysAgo(25),
    },

    // Project 2: Website Redesign
    {
      title: "Create brand style guide",
      description:
        "Document color palette, typography, iconography, and component patterns for the new brand identity.",
      status: "DONE",
      priority: "HIGH",
      order: 0,
      projectId: projects[2].id,
      assigneeId: users[3].id,
      creatorId: users[5].id,
      dueDate: daysAgo(12),
      estimateHours: 12,
      loggedHours: 10,
      startDate: daysAgo(18),
    },
    {
      title: "Build landing page with hero section",
      description:
        "Develop the main landing page with animated hero, feature highlights, and social proof sections.",
      status: "IN_PROGRESS",
      priority: "HIGH",
      order: 1,
      projectId: projects[2].id,
      assigneeId: users[2].id,
      creatorId: users[5].id,
      dueDate: daysFromNow(10),
      estimateHours: 20,
      loggedHours: 8,
      startDate: daysAgo(8),
    },
    {
      title: "Write case studies content",
      description:
        "Create 3 in-depth case studies featuring customer success stories with data and quotes.",
      status: "TODO",
      priority: "MEDIUM",
      order: 2,
      projectId: projects[2].id,
      assigneeId: users[5].id,
      creatorId: users[5].id,
      dueDate: daysFromNow(25),
      estimateHours: 10,
      loggedHours: 0,
    },
    {
      title: "Implement analytics tracking",
      description:
        "Set up event tracking for page views, CTA clicks, and conversion funnels.",
      status: "BACKLOG",
      priority: "MEDIUM",
      order: 3,
      projectId: projects[2].id,
      assigneeId: null,
      creatorId: users[5].id,
      estimateHours: 6,
      loggedHours: 0,
    },

    // Project 3: AI Integration (PAUSED)
    {
      title: "Research LLM providers and pricing",
      description:
        "Evaluate OpenAI, Anthropic, and open-source models for task summarization and suggestions.",
      status: "DONE",
      priority: "HIGH",
      order: 0,
      projectId: projects[3].id,
      assigneeId: users[4].id,
      creatorId: users[4].id,
      dueDate: daysAgo(40),
      estimateHours: 10,
      loggedHours: 8,
      startDate: daysAgo(55),
    },
    {
      title: "Build AI suggestion pipeline",
      description:
        "Create the backend pipeline for generating task suggestions, priority recommendations, and deadline predictions.",
      status: "IN_PROGRESS",
      priority: "HIGH",
      order: 1,
      projectId: projects[3].id,
      assigneeId: users[4].id,
      creatorId: users[1].id,
      estimateHours: 32,
      loggedHours: 18,
      startDate: daysAgo(30),
    },
    {
      title: "Design AI assistant chat UI",
      description:
        "Build the conversational AI interface with streaming responses and context awareness.",
      status: "TODO",
      priority: "MEDIUM",
      order: 2,
      projectId: projects[3].id,
      assigneeId: users[3].id,
      creatorId: users[4].id,
      estimateHours: 20,
      loggedHours: 0,
    },

    // Project 4: API Gateway (COMPLETED)
    {
      title: "Design REST API specification",
      description:
        "Create OpenAPI 3.0 spec for all public endpoints with request/response schemas.",
      status: "DONE",
      priority: "HIGH",
      order: 0,
      projectId: projects[4].id,
      assigneeId: users[4].id,
      creatorId: users[4].id,
      dueDate: daysAgo(70),
      estimateHours: 16,
      loggedHours: 14,
      startDate: daysAgo(85),
    },
    {
      title: "Implement OAuth 2.0 flow",
      description:
        "Build authorization server with PKCE support for third-party app integrations.",
      status: "DONE",
      priority: "URGENT",
      order: 1,
      projectId: projects[4].id,
      assigneeId: users[6].id,
      creatorId: users[4].id,
      dueDate: daysAgo(50),
      estimateHours: 20,
      loggedHours: 22,
      startDate: daysAgo(75),
    },
    {
      title: "Set up rate limiting middleware",
      description:
        "Implement token bucket rate limiting with configurable limits per API key and endpoint.",
      status: "DONE",
      priority: "MEDIUM",
      order: 2,
      projectId: projects[4].id,
      assigneeId: users[4].id,
      creatorId: users[1].id,
      dueDate: daysAgo(30),
      estimateHours: 8,
      loggedHours: 9,
      startDate: daysAgo(45),
    },
    {
      title: "Write developer documentation",
      description:
        "Create comprehensive docs with quickstart guides, API reference, and code examples.",
      status: "DONE",
      priority: "MEDIUM",
      order: 3,
      projectId: projects[4].id,
      assigneeId: users[1].id,
      creatorId: users[4].id,
      dueDate: daysAgo(10),
      estimateHours: 14,
      loggedHours: 16,
      startDate: daysAgo(25),
    },

    // Project 5: Analytics Dashboard
    {
      title: "Design dashboard layout and widgets",
      description:
        "Create responsive dashboard layout with customizable widget grid and drag-and-drop arrangement.",
      status: "IN_PROGRESS",
      priority: "HIGH",
      order: 0,
      projectId: projects[5].id,
      assigneeId: users[3].id,
      creatorId: users[2].id,
      dueDate: daysFromNow(14),
      estimateHours: 16,
      loggedHours: 4,
      startDate: daysAgo(10),
    },
    {
      title: "Build data aggregation service",
      description:
        "Create backend service to aggregate and pre-compute metrics from various data sources.",
      status: "TODO",
      priority: "HIGH",
      order: 1,
      projectId: projects[5].id,
      assigneeId: users[4].id,
      creatorId: users[2].id,
      dueDate: daysFromNow(28),
      estimateHours: 24,
      loggedHours: 0,
    },
    {
      title: "Implement chart components",
      description:
        "Build reusable chart components (line, bar, pie, area) with Recharts and interactive tooltips.",
      status: "BACKLOG",
      priority: "MEDIUM",
      order: 2,
      projectId: projects[5].id,
      assigneeId: users[2].id,
      creatorId: users[2].id,
      estimateHours: 16,
      loggedHours: 0,
    },
    {
      title: "Add CSV/PDF export functionality",
      description:
        "Allow users to export dashboard data and custom reports to CSV and PDF formats.",
      status: "BACKLOG",
      priority: "LOW",
      order: 3,
      projectId: projects[5].id,
      assigneeId: null,
      creatorId: users[2].id,
      estimateHours: 10,
      loggedHours: 0,
    },
    {
      title: "Set up data refresh scheduling",
      description:
        "Implement scheduled data refresh with incremental updates and cache invalidation.",
      status: "BACKLOG",
      priority: "MEDIUM",
      order: 4,
      projectId: projects[5].id,
      assigneeId: null,
      creatorId: users[4].id,
      estimateHours: 8,
      loggedHours: 0,
    },
  ];

  const tasks = [];
  for (const t of tasksData) {
    const task = await db.task.create({ data: t });
    tasks.push(task);
  }
  console.log(`✅ Created ${tasks.length} tasks`);

  // ══════════════════════════════════════════
  // 8. SUBTASKS (children of existing tasks)
  // ══════════════════════════════════════════
  const subtasks = [
    {
      title: "Set up WebSocket server with Socket.io",
      status: "DONE",
      priority: "HIGH",
      projectId: projects[0].id,
      assigneeId: users[4].id,
      creatorId: users[4].id,
      parentId: tasks[1].id, // real-time collaboration engine
      estimateHours: 12,
      loggedHours: 11,
      dueDate: daysAgo(5),
      startDate: daysAgo(14),
    },
    {
      title: "Implement CRDT conflict resolution",
      status: "IN_PROGRESS",
      priority: "HIGH",
      projectId: projects[0].id,
      assigneeId: users[4].id,
      creatorId: users[4].id,
      parentId: tasks[1].id,
      estimateHours: 16,
      loggedHours: 6,
      dueDate: daysFromNow(10),
      startDate: daysAgo(5),
    },
    {
      title: "Add presence indicators",
      status: "TODO",
      priority: "MEDIUM",
      projectId: projects[0].id,
      assigneeId: users[6].id,
      creatorId: users[4].id,
      parentId: tasks[1].id,
      estimateHours: 8,
      loggedHours: 0,
    },
    {
      title: "Login screen UI",
      status: "DONE",
      priority: "HIGH",
      projectId: projects[1].id,
      assigneeId: users[2].id,
      creatorId: users[2].id,
      parentId: tasks[7].id, // authentication flow
      estimateHours: 6,
      loggedHours: 5,
      dueDate: daysAgo(5),
      startDate: daysAgo(12),
    },
    {
      title: "Biometric auth integration",
      status: "TODO",
      priority: "MEDIUM",
      projectId: projects[1].id,
      assigneeId: users[6].id,
      creatorId: users[2].id,
      parentId: tasks[7].id,
      estimateHours: 8,
      loggedHours: 0,
      dueDate: daysFromNow(5),
    },
  ];

  for (const st of subtasks) {
    await db.task.create({
      data: {
        title: st.title,
        status: st.status,
        priority: st.priority,
        projectId: st.projectId,
        assigneeId: st.assigneeId,
        creatorId: st.creatorId,
        parentId: st.parentId,
        estimateHours: st.estimateHours,
        loggedHours: st.loggedHours,
        dueDate: st.dueDate,
        startDate: st.startDate,
      },
    });
  }
  console.log(`📋 Created ${subtasks.length} subtasks`);

  // ══════════════════════════════════════════
  // 9. TASK LABELS
  // ══════════════════════════════════════════
  const labelsData = [
    { name: "bug", color: "#ef4444", taskId: tasks[1].id },
    { name: "feature", color: "#3b82f6", taskId: tasks[1].id },
    { name: "frontend", color: "#8b5cf6", taskId: tasks[0].id },
    { name: "design", color: "#f59e0b", taskId: tasks[0].id },
    { name: "backend", color: "#10b981", taskId: tasks[2].id },
    { name: "database", color: "#06b6d4", taskId: tasks[2].id },
    { name: "security", color: "#ef4444", taskId: tasks[16].id },
    { name: "documentation", color: "#6366f1", taskId: tasks[19].id },
    { name: "performance", color: "#f97316", taskId: tasks[1].id },
    { name: "mobile", color: "#14b8a6", taskId: tasks[7].id },
    { name: "AI/ML", color: "#a855f7", taskId: tasks[14].id },
    { name: "urgent", color: "#dc2626", taskId: tasks[8].id },
    { name: "chore", color: "#6b7280", taskId: tasks[4].id },
    { name: "ux", color: "#ec4899", taskId: tasks[20].id },
    { name: "devops", color: "#0ea5e9", taskId: tasks[18].id },
  ];

  for (const l of labelsData) {
    await db.taskLabel.create({ data: l });
  }
  console.log(`🏷️ Created ${labelsData.length} task labels`);

  // ══════════════════════════════════════════
  // 10. TASK COMMENTS
  // ══════════════════════════════════════════
  const commentsData = [
    {
      content:
        "I've uploaded the Figma link with the updated navigation. Let me know if the hover states look good!",
      taskId: tasks[0].id,
      authorId: users[3].id,
      createdAt: daysAgo(18),
    },
    {
      content:
        "Looks great! I'll start implementing this tomorrow. One question - should the search be global or project-scoped?",
      taskId: tasks[0].id,
      authorId: users[2].id,
      createdAt: daysAgo(17),
    },
    {
      content:
        "Both! Start with project-scoped, then we can add global search as a follow-up. I've updated the Figma to reflect this.",
      taskId: tasks[0].id,
      authorId: users[3].id,
      createdAt: daysAgo(17),
    },
    {
      content:
        "The WebSocket connection is stable now. Running load tests with 500 concurrent users - seeing ~15ms latency. CRDT merge conflicts are down to 0.3%.",
      taskId: tasks[1].id,
      authorId: users[4].id,
      createdAt: daysAgo(3),
    },
    {
      content:
        "Impressive numbers! Can we also test the reconnection behavior when users switch between WiFi and cellular?",
      taskId: tasks[1].id,
      authorId: users[1].id,
      createdAt: daysAgo(2),
    },
    {
      content:
        "Good point. I'll add that to the test suite. Also, I noticed we need to handle the case where a user has multiple tabs open.",
      taskId: tasks[1].id,
      authorId: users[4].id,
      createdAt: daysAgo(2),
    },
    {
      content:
        "The multi-tenancy migration is mostly done. Just need to add the row-level security policies for the tasks table.",
      taskId: tasks[2].id,
      authorId: users[4].id,
      createdAt: daysAgo(5),
    },
    {
      content:
        "Make sure to add comprehensive test coverage for the RLS policies. We don't want any data leaks between orgs.",
      taskId: tasks[2].id,
      authorId: users[1].id,
      createdAt: daysAgo(4),
    },
    {
      content:
        "The mobile auth screens are looking polished. Ready for design review!",
      taskId: tasks[7].id,
      authorId: users[2].id,
      createdAt: daysAgo(5),
    },
    {
      content:
        "Love the flow! The biometric prompt placement is perfect. Just a minor tweak - can we add a 'Use passcode instead' fallback?",
      taskId: tasks[7].id,
      authorId: users[3].id,
      createdAt: daysAgo(4),
    },
    {
      content:
        "Case study #1 is drafted. Need to get approval from Acme Corp before publishing. Their metrics are really impressive - 40% productivity increase.",
      taskId: tasks[11].id,
      authorId: users[5].id,
      createdAt: daysAgo(2),
    },
    {
      content:
        "The API gateway is live! We've already got 3 partners in the beta program. Documentation has been well-received.",
      taskId: tasks[19].id,
      authorId: users[1].id,
      createdAt: daysAgo(8),
    },
    {
      content:
        "Dashboard wireframes are ready for review. I've included both the default view and the customizable layout mode.",
      taskId: tasks[20].id,
      authorId: users[3].id,
      createdAt: daysAgo(1),
    },
    {
      content:
        "These look amazing! I especially like the widget resize handles. Let's make sure the chart components support dark mode from day one.",
      taskId: tasks[20].id,
      authorId: users[2].id,
      createdAt: hoursAgo(12),
    },
  ];

  for (const c of commentsData) {
    await db.taskComment.create({
      data: {
        content: c.content,
        taskId: c.taskId,
        authorId: c.authorId,
        createdAt: c.createdAt,
      },
    });
  }
  console.log(`💬 Created ${commentsData.length} task comments`);

  // ══════════════════════════════════════════
  // 11. CHANNELS
  // ══════════════════════════════════════════
  const channels = await Promise.all([
    db.channel.create({
      data: {
        name: "general",
        type: "PUBLIC",
        description: "Company-wide announcements and casual conversation",
        organizationId: org.id,
      },
    }),
    db.channel.create({
      data: {
        name: "engineering",
        type: "PUBLIC",
        description: "Engineering team discussions, code reviews, and technical decisions",
        organizationId: org.id,
      },
    }),
    db.channel.create({
      data: {
        name: "random",
        type: "PUBLIC",
        description: "Non-work banter, memes, and watercooler chat",
        organizationId: org.id,
      },
    }),
    db.channel.create({
      data: {
        name: "design-review",
        type: "PUBLIC",
        description: "Design reviews, feedback requests, and design system updates",
        organizationId: org.id,
      },
    }),
  ]);
  console.log(`💬 Created ${channels.length} channels`);

  // Channel members - add all users to all channels
  for (const channel of channels) {
    for (const user of users) {
      await db.channelMember.create({
        data: {
          userId: user.id,
          channelId: channel.id,
          lastRead: hoursAgo(Math.floor(Math.random() * 24)),
        },
      });
    }
  }
  console.log("👥 Created channel memberships");

  // ══════════════════════════════════════════
  // 12. MESSAGES (~40 messages)
  // ══════════════════════════════════════════
  const messagesData = [
    // #general
    {
      content: "Good morning everyone! 🌅 Hope you all had a great weekend.",
      channelId: channels[0].id,
      senderId: users[0].id,
      createdAt: daysAgo(3),
    },
    {
      content:
        "Morning! Quick reminder - we have the all-hands meeting this Friday at 2pm. I'll send out the agenda later today.",
      channelId: channels[0].id,
      senderId: users[0].id,
      createdAt: daysAgo(3),
    },
    {
      content: "Thanks for the heads up, Alex! Will block that time off.",
      channelId: channels[0].id,
      senderId: users[5].id,
      createdAt: daysAgo(3),
    },
    {
      content:
        "🎉 Big news: We just hit 10,000 active users on the platform! Incredible milestone for the team.",
      channelId: channels[0].id,
      senderId: users[0].id,
      createdAt: daysAgo(1),
    },
    {
      content:
        "That's amazing! The growth has been really accelerating this quarter. 🚀",
      channelId: channels[0].id,
      senderId: users[5].id,
      createdAt: daysAgo(1),
    },
    {
      content: "Woohoo! Great work everyone. Time to celebrate! 🎊",
      channelId: channels[0].id,
      senderId: users[2].id,
      createdAt: daysAgo(1),
    },
    {
      content:
        "Reminder: Office lunch tomorrow at noon. We're ordering from that new Thai place everyone's been wanting to try! 🍜",
      channelId: channels[0].id,
      senderId: users[5].id,
      createdAt: hoursAgo(6),
    },
    {
      content:
        "Welcome aboard our new team member Nina! She's joining as our UX Researcher. Please give her a warm welcome! 👋",
      channelId: channels[0].id,
      senderId: users[0].id,
      createdAt: daysAgo(10),
    },
    {
      content:
        "Thanks everyone! Really excited to be here. Looking forward to working with you all.",
      channelId: channels[0].id,
      senderId: users[7].id,
      createdAt: daysAgo(10),
    },
    {
      content:
        "Welcome Nina! Let's grab coffee this week and I'll walk you through our design system.",
      channelId: channels[0].id,
      senderId: users[3].id,
      createdAt: daysAgo(10),
    },

    // #engineering
    {
      content:
        "I'm planning to upgrade our Prisma version this week. Any objections? There are some important performance fixes in the latest release.",
      channelId: channels[1].id,
      senderId: users[1].id,
      createdAt: daysAgo(5),
    },
    {
      content:
        "Sounds good to me. I saw the benchmark results - query performance improved by ~30%. Let's do it.",
      channelId: channels[1].id,
      senderId: users[4].id,
      createdAt: daysAgo(5),
    },
    {
      content:
        "Just pushed the WebSocket refactor to staging. The real-time sync is feeling much snappier now. PR link in the project board.",
      channelId: channels[1].id,
      senderId: users[4].id,
      createdAt: daysAgo(2),
    },
    {
      content:
        "Nice! I'll review it this afternoon. Did you run the load tests yet?",
      channelId: channels[1].id,
      senderId: users[1].id,
      createdAt: daysAgo(2),
    },
    {
      content:
        "Yes, 500 concurrent users with <20ms latency. Full report is in the PR description.",
      channelId: channels[1].id,
      senderId: users[4].id,
      createdAt: daysAgo(2),
    },
    {
      content:
        "Quick question - are we still using Zustand for state management or are we moving to something else?",
      channelId: channels[1].id,
      senderId: users[6].id,
      createdAt: daysAgo(4),
    },
    {
      content:
        "Sticking with Zustand for now. It's been working well for us and the bundle size is tiny.",
      channelId: channels[1].id,
      senderId: users[1].id,
      createdAt: daysAgo(4),
    },
    {
      content:
        "Heads up: I'll be deploying the v2.0 branch to staging tonight around 10pm. Expect ~15 minutes of downtime.",
      channelId: channels[1].id,
      senderId: users[4].id,
      createdAt: hoursAgo(4),
    },
    {
      content:
        "The API gateway is now handling 50k requests/minute with no issues. Rate limiting is working as expected.",
      channelId: channels[1].id,
      senderId: users[4].id,
      createdAt: daysAgo(8),
    },
    {
      content: "That's solid. What's the p99 latency looking like?",
      channelId: channels[1].id,
      senderId: users[1].id,
      createdAt: daysAgo(8),
    },
    {
      content: "~45ms p99 for cached responses, ~120ms for non-cached. Well within our SLO.",
      channelId: channels[1].id,
      senderId: users[4].id,
      createdAt: daysAgo(8),
    },

    // #random
    {
      content: "Anyone up for a run this Saturday morning? 🏃",
      channelId: channels[2].id,
      senderId: users[2].id,
      createdAt: daysAgo(6),
    },
    {
      content: "I'm in! What time and where?",
      channelId: channels[2].id,
      senderId: users[6].id,
      createdAt: daysAgo(6),
    },
    {
      content: "7am at the park? 5k route?",
      channelId: channels[2].id,
      senderId: users[4].id,
      createdAt: daysAgo(6),
    },
    {
      content: "Perfect. 7am, 5k route. See you all there! 💪",
      channelId: channels[2].id,
      senderId: users[2].id,
      createdAt: daysAgo(6),
    },
    {
      content: "Has anyone watched the new season of that show? No spoilers please!",
      channelId: channels[2].id,
      senderId: users[3].id,
      createdAt: daysAgo(4),
    },
    {
      content: "Just finished it last night. SO good. Won't say anything though 🤐",
      channelId: channels[2].id,
      senderId: users[7].id,
      createdAt: daysAgo(4),
    },
    {
      content:
        "The new coffee machine in the kitchen is a game changer. Espresso quality is chef's kiss ☕",
      channelId: channels[2].id,
      senderId: users[5].id,
      createdAt: daysAgo(1),
    },
    {
      content: "Finally! The old one was making swamp water 😂",
      channelId: channels[2].id,
      senderId: users[6].id,
      createdAt: daysAgo(1),
    },

    // #design-review
    {
      content:
        "I've uploaded the new onboarding flow designs to Figma. Looking for feedback on the step 3 illustration style.",
      channelId: channels[3].id,
      senderId: users[3].id,
      createdAt: daysAgo(4),
    },
    {
      content:
        "Love the direction! The illustrations feel much more on-brand now. Maybe we could add some subtle animations between steps?",
      channelId: channels[3].id,
      senderId: users[7].id,
      createdAt: daysAgo(4),
    },
    {
      content:
        "Great idea Nina. I was thinking the same thing. I'll prototype some transitions.",
      channelId: channels[3].id,
      senderId: users[3].id,
      createdAt: daysAgo(3),
    },
    {
      content:
        "Updated the design system with the new color tokens. Please update your local variables: Figma link in thread.",
      channelId: channels[3].id,
      senderId: users[3].id,
      createdAt: daysAgo(7),
    },
    {
      content:
        "Thanks Emily! The new semantic color system is much cleaner. Makes dark mode support straightforward.",
      channelId: channels[3].id,
      senderId: users[2].id,
      createdAt: daysAgo(7),
    },
    {
      content:
        "Here are the dashboard wireframes for the analytics project. I went with a card-based layout with drag-and-drop customization.",
      channelId: channels[3].id,
      senderId: users[3].id,
      createdAt: hoursAgo(18),
    },
    {
      content:
        "Really clean layout! One suggestion - can we add a 'collapse all' button for the sidebar widgets?",
      channelId: channels[3].id,
      senderId: users[2].id,
      createdAt: hoursAgo(12),
    },
    {
      content:
        "Good call. I'll add that. Also thinking about a 'Save layout' preset feature so users can switch between different views.",
      channelId: channels[3].id,
      senderId: users[3].id,
      createdAt: hoursAgo(10),
    },
    {
      content:
        "That would be really useful for different workflows - like a 'Daily Standup' view vs a 'Sprint Review' view.",
      channelId: channels[3].id,
      senderId: users[5].id,
      createdAt: hoursAgo(8),
    },
  ];

  // Add a pinned message
  const pinnedMessageData = {
    content:
      "📌 **Design Review Schedule**: Every Tuesday and Thursday at 3pm. Please have your designs ready for review at least 1 hour before the meeting.",
    channelId: channels[3].id,
    senderId: users[3].id,
    isPinned: true,
    createdAt: daysAgo(30),
  };

  const allMessages = [...messagesData, pinnedMessageData];
  for (const m of allMessages) {
    await db.message.create({
      data: {
        content: m.content,
        type: (m as any).type || "TEXT",
        channelId: m.channelId,
        senderId: m.senderId,
        isPinned: (m as any).isPinned || false,
        createdAt: m.createdAt,
      },
    });
  }
  console.log(`✉️ Created ${allMessages.length} messages`);

  // ══════════════════════════════════════════
  // 13. NOTIFICATIONS (~15)
  // ══════════════════════════════════════════
  const notificationsData = [
    {
      title: "Task assigned to you",
      content:
        'Sarah Mitchell assigned you "Build notification preferences UI" in NexDesk Platform v2.0',
      type: "ASSIGNMENT",
      userId: users[2].id,
      read: true,
      createdAt: daysAgo(5),
    },
    {
      title: "New comment on your task",
      content:
        'David Kim commented on "Implement real-time collaboration engine": "The WebSocket connection is stable now..."',
      type: "COMMENT",
      userId: users[1].id,
      read: true,
      createdAt: daysAgo(3),
    },
    {
      title: "You were mentioned",
      content:
        'Emily Rodriguez mentioned you in #design-review: "@Marcus Love the direction! The illustrations feel..."',
      type: "MENTION",
      userId: users[2].id,
      read: false,
      createdAt: daysAgo(4),
    },
    {
      title: "Task due soon",
      content:
        '"Build authentication flow" is due in 7 days. Current progress: 60% complete.',
      type: "DUE_DATE",
      userId: users[2].id,
      read: false,
      createdAt: daysAgo(1),
    },
    {
      title: "Meeting reminder",
      content:
        "Sprint Planning starts in 1 hour. Click to join the video call.",
      type: "SYSTEM",
      userId: users[1].id,
      read: false,
      createdAt: hoursAgo(2),
    },
    {
      title: "AI Suggestion",
      content:
        "Based on your recent tasks, you might want to prioritize 'Build data aggregation service' - it's blocking 2 other tasks.",
      type: "AI_SUGGESTION",
      userId: users[2].id,
      read: false,
      createdAt: hoursAgo(6),
    },
    {
      title: "New comment on your task",
      content:
        'Alex Chen commented on "Migrate database to support multi-tenancy": "Make sure to add comprehensive test coverage..."',
      type: "COMMENT",
      userId: users[4].id,
      read: true,
      createdAt: daysAgo(4),
    },
    {
      title: "You were mentioned",
      content:
        'Lisa Wang mentioned you in #general: "Welcome aboard our new team member Nina! She\'s joining as..."',
      type: "MENTION",
      userId: users[7].id,
      read: true,
      createdAt: daysAgo(10),
    },
    {
      title: "Task completed",
      content:
        'James Park completed "Set up React Native project structure" in Mobile App',
      type: "SYSTEM",
      userId: users[1].id,
      read: true,
      createdAt: daysAgo(15),
    },
    {
      title: "Task assigned to you",
      content:
        'Emily Rodriguez assigned you "Implement chart components" in Analytics Dashboard',
      type: "ASSIGNMENT",
      userId: users[2].id,
      read: false,
      createdAt: daysAgo(1),
    },
    {
      title: "AI Suggestion",
      content:
        "Your tasks in 'AI Integration' have been paused for 2 weeks. Consider updating priorities or archiving.",
      type: "AI_SUGGESTION",
      userId: users[1].id,
      read: false,
      createdAt: daysAgo(2),
    },
    {
      title: "Task due soon",
      content:
        '"Design mobile UI components" was due 2 days ago. Please update the status.',
      type: "DUE_DATE",
      userId: users[3].id,
      read: false,
      createdAt: daysAgo(2),
    },
    {
      title: "Welcome to NexDesk!",
      content:
        "You've been added to the NexDesk Corp workspace. Start by exploring your projects and teams.",
      type: "SYSTEM",
      userId: users[7].id,
      read: true,
      createdAt: daysAgo(10),
    },
    {
      title: "New comment on your task",
      content:
        'Nina Patel commented on "Design dashboard layout and widgets": "These look amazing! I especially like..."',
      type: "COMMENT",
      userId: users[3].id,
      read: false,
      createdAt: hoursAgo(10),
    },
    {
      title: "Meeting accepted",
      content:
        "David Kim accepted your meeting invitation for 'Sprint Review - Platform v2.0'",
      type: "SYSTEM",
      userId: users[0].id,
      read: true,
      createdAt: daysAgo(6),
    },
  ];

  for (const n of notificationsData) {
    await db.notification.create({
      data: {
        title: n.title,
        content: n.content,
        type: n.type,
        read: n.read,
        userId: n.userId,
        createdAt: n.createdAt,
      },
    });
  }
  console.log(`🔔 Created ${notificationsData.length} notifications`);

  // ══════════════════════════════════════════
  // 14. MEETINGS (~5)
  // ══════════════════════════════════════════
  const meetingsData = [
    {
      title: "Sprint Planning - Platform v2.0",
      description:
        "Plan sprint 14 tasks and assign story points. Review backlog priorities.",
      startTime: daysFromNow(1),
      endTime: daysFromNow(1),
      meetingLink: "https://meet.google.com/abc-defg-hij",
      organizationId: org.id,
      creatorId: users[1].id,
      projectId: projects[0].id,
      attendees: [
        { userId: users[0].id, status: "ACCEPTED" },
        { userId: users[1].id, status: "ACCEPTED" },
        { userId: users[2].id, status: "ACCEPTED" },
        { userId: users[4].id, status: "PENDING" },
        { userId: users[6].id, status: "ACCEPTED" },
      ],
    },
    {
      title: "Design Review: Dashboard Wireframes",
      description:
        "Review the analytics dashboard wireframes and gather feedback from engineering.",
      startTime: daysFromNow(2),
      endTime: daysFromNow(2),
      meetingLink: "https://meet.google.com/klm-nopq-rst",
      organizationId: org.id,
      creatorId: users[3].id,
      projectId: projects[5].id,
      attendees: [
        { userId: users[2].id, status: "ACCEPTED" },
        { userId: users[3].id, status: "ACCEPTED" },
        { userId: users[7].id, status: "ACCEPTED" },
        { userId: users[5].id, status: "PENDING" },
      ],
    },
    {
      title: "1:1 - Sarah & Marcus",
      description: "Weekly 1:1 check-in. Discuss career growth and current blockers.",
      startTime: daysAgo(3),
      endTime: daysAgo(3),
      meetingLink: "https://meet.google.com/uvw-xyza-bcd",
      organizationId: org.id,
      creatorId: users[1].id,
      attendees: [
        { userId: users[1].id, status: "ACCEPTED" },
        { userId: users[2].id, status: "ACCEPTED" },
      ],
    },
    {
      title: "Q3 OKR Review",
      description:
        "Review Q3 objectives and key results. Discuss progress and adjustments for Q4.",
      startTime: daysAgo(7),
      endTime: daysAgo(7),
      meetingLink: "https://meet.google.com/efg-hijk-lmn",
      organizationId: org.id,
      creatorId: users[0].id,
      attendees: [
        { userId: users[0].id, status: "ACCEPTED" },
        { userId: users[1].id, status: "ACCEPTED" },
        { userId: users[3].id, status: "ACCEPTED" },
        { userId: users[5].id, status: "ACCEPTED" },
        { userId: users[4].id, status: "DECLINED" },
      ],
    },
    {
      title: "All-Hands Meeting",
      description:
        "Monthly all-hands. Company updates, team highlights, and Q&A.",
      startTime: daysFromNow(4),
      endTime: daysFromNow(4),
      meetingLink: "https://meet.google.com/opq-rstu-vwx",
      organizationId: org.id,
      creatorId: users[0].id,
      attendees: users.map((u) => ({
        userId: u.id,
        status: u.id === users[4].id ? "PENDING" : "ACCEPTED",
      })),
    },
  ];

  // Fix meeting end times to be 1 hour after start
  for (const m of meetingsData) {
    const end = new Date(m.startTime.getTime() + 3600000);
    const meeting = await db.meeting.create({
      data: {
        title: m.title,
        description: m.description,
        startTime: m.startTime,
        endTime: end,
        meetingLink: m.meetingLink,
        organizationId: m.organizationId,
        creatorId: m.creatorId,
        projectId: m.projectId || null,
      },
    });

    for (const a of m.attendees) {
      await db.meetingAttendee.create({
        data: {
          userId: a.userId,
          meetingId: meeting.id,
          status: a.status,
          respondedAt: a.status !== "PENDING" ? daysAgo(1) : null,
        },
      });
    }
  }
  console.log(`📅 Created ${meetingsData.length} meetings`);

  // ══════════════════════════════════════════
  // 15. FOLDERS & FILES
  // ══════════════════════════════════════════
  const folders = await Promise.all([
    db.folder.create({
      data: { name: "Design Assets", organizationId: org.id },
    }),
    db.folder.create({
      data: { name: "Documentation", organizationId: org.id },
    }),
    db.folder.create({
      data: {
        name: "Q3 Reports",
        parentId: (await db.folder.create({
          data: { name: "Reports", organizationId: org.id },
        })).id,
        organizationId: org.id,
      },
    }),
  ]);
  // Re-fetch the Q3 Reports folder (it's folders[2])
  const reportsFolder = await db.folder.findFirst({
    where: { name: "Reports", organizationId: org.id },
  });

  const filesData = [
    {
      name: "Brand Guidelines v2.pdf",
      url: "/files/brand-guidelines-v2.pdf",
      size: 2400000,
      mimeType: "application/pdf",
      folderId: folders[0].id,
      organizationId: org.id,
      uploadedById: users[3].id,
    },
    {
      name: "Design System Tokens.json",
      url: "/files/design-system-tokens.json",
      size: 48000,
      mimeType: "application/json",
      folderId: folders[0].id,
      organizationId: org.id,
      uploadedById: users[3].id,
    },
    {
      name: "Wireframes - Dashboard.fig",
      url: "/files/wireframes-dashboard.fig",
      size: 15600000,
      mimeType: "application/x-figma",
      folderId: folders[0].id,
      organizationId: org.id,
      uploadedById: users[3].id,
    },
    {
      name: "API Documentation v3.md",
      url: "/files/api-docs-v3.md",
      size: 89000,
      mimeType: "text/markdown",
      folderId: folders[1].id,
      organizationId: org.id,
      uploadedById: users[4].id,
    },
    {
      name: "Architecture Overview.png",
      url: "/files/architecture-overview.png",
      size: 3200000,
      mimeType: "image/png",
      folderId: folders[1].id,
      organizationId: org.id,
      uploadedById: users[1].id,
    },
    {
      name: "Q3 Revenue Report.xlsx",
      url: "/files/q3-revenue-report.xlsx",
      size: 450000,
      mimeType:
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      folderId: reportsFolder!.id,
      organizationId: org.id,
      uploadedById: users[5].id,
    },
    {
      name: "Onboarding Screens Final.png",
      url: "/files/onboarding-screens-final.png",
      size: 4100000,
      mimeType: "image/png",
      folderId: folders[0].id,
      organizationId: org.id,
      uploadedById: users[3].id,
    },
  ];

  for (const f of filesData) {
    await db.file.create({ data: f });
  }
  console.log(`📂 Created ${folders.length + 1} folders and ${filesData.length} files`);

  // ══════════════════════════════════════════
  // 16. AI CONVERSATIONS
  // ══════════════════════════════════════════
  const aiConversations = await Promise.all([
    db.aiConversation.create({
      data: {
        title: "Help with API rate limiting strategy",
        userId: users[4].id,
        model: "gpt-4",
      },
    }),
    db.aiConversation.create({
      data: {
        title: "Generate sprint retrospective notes",
        userId: users[1].id,
        model: "gpt-4",
      },
    }),
  ]);

  const aiMessagesData = [
    // Conversation 1: API rate limiting
    {
      role: "user",
      content:
        "I'm implementing rate limiting for our API gateway. We're using a token bucket algorithm. What are the best practices for handling rate limit headers and 429 responses?",
      conversationId: aiConversations[0].id,
      createdAt: daysAgo(5),
    },
    {
      role: "assistant",
      content:
        "Great question! Here are the best practices:\n\n1. **Include standard headers**: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, and `X-RateLimit-Reset`\n2. **Return Retry-After header** on 429 responses so clients know when to retry\n3. **Use a sliding window** instead of fixed window for smoother rate limiting\n4. **Implement tiered limits** based on the user's subscription plan\n5. **Log rate limit hits** for monitoring and abuse detection\n\nWould you like me to show you an implementation example with any specific framework?",
      conversationId: aiConversations[0].id,
      createdAt: daysAgo(5),
    },
    {
      role: "user",
      content:
        "Yes, can you show a Redis-based implementation that handles distributed rate limiting?",
      conversationId: aiConversations[0].id,
      createdAt: daysAgo(5),
    },
    {
      role: "assistant",
      content:
        "Here's a Redis-based distributed rate limiter using the sliding window counter algorithm:\n\n```typescript\nasync function checkRateLimit(key: string, limit: number, windowMs: number) {\n  const now = Date.now();\n  const windowStart = now - windowMs;\n  \n  const multi = redis.multi();\n  multi.zremrangebyscore(key, 0, windowStart);\n  multi.zadd(key, now, `${now}-${Math.random()}`);\n  multi.zcard(key);\n  multi.pexpire(key, windowMs);\n  \n  const results = await multi.exec();\n  const count = results[2][1];\n  \n  return {\n    allowed: count <= limit,\n    remaining: Math.max(0, limit - count),\n    resetAt: now + windowMs,\n  };\n}\n```\n\nThis uses a sorted set where each request is stored with its timestamp as the score. The `zremrangebyscore` cleans up old entries, giving you a sliding window effect.",
      conversationId: aiConversations[0].id,
      createdAt: daysAgo(5),
    },

    // Conversation 2: Sprint retrospective
    {
      role: "user",
      content:
        "Can you help me draft sprint retrospective notes for our engineering team? We completed 18 story points out of 24 planned. Key issues: 2 P1 bugs took longer than expected, and we had 1 day of environment downtime.",
      conversationId: aiConversations[1].id,
      createdAt: daysAgo(2),
    },
    {
      role: "assistant",
      content:
        "Here's a structured sprint retrospective summary:\n\n## Sprint 13 Retrospective\n\n### 📊 Metrics\n- **Velocity**: 18/24 story points (75%)\n- **Bugs**: 2 P1, 3 P2\n- **Downtime**: 1 day (staging environment)\n\n### ✅ What Went Well\n- Team collaboration was strong, especially on the real-time collaboration feature\n- Code review turnaround improved to <4 hours average\n- Design handoffs were smoother with the new Figma plugin\n\n### ❌ What Didn't Go Well\n- P1 bugs consumed 40% of sprint capacity\n- Staging environment downtime blocked QA for a full day\n- Story point estimation was off for backend tasks (consistently under-estimated)\n\n### 🔄 Action Items\n1. Add a bug buffer (20% of capacity) to future sprint planning\n2. Improve staging environment reliability with automated health checks\n3. Use planning poker for better estimation on backend stories\n\nWould you like me to expand on any of these sections?",
      conversationId: aiConversations[1].id,
      createdAt: daysAgo(2),
    },
  ];

  for (const m of aiMessagesData) {
    await db.aiMessage.create({
      data: {
        role: m.role,
        content: m.content,
        conversationId: m.conversationId,
        createdAt: m.createdAt,
      },
    });
  }
  console.log(`🤖 Created ${aiConversations.length} AI conversations with ${aiMessagesData.length} messages`);

  // ══════════════════════════════════════════
  // 17. INVOICES & SUBSCRIPTION
  // ══════════════════════════════════════════
  await db.invoice.createMany({
    data: [
      {
        invoiceNumber: "INV-2024-001",
        amount: 299.0,
        currency: "USD",
        status: "PAID",
        dueDate: daysAgo(60),
        organizationId: org.id,
        createdAt: daysAgo(90),
      },
      {
        invoiceNumber: "INV-2024-002",
        amount: 299.0,
        currency: "USD",
        status: "PAID",
        dueDate: daysAgo(30),
        organizationId: org.id,
        createdAt: daysAgo(60),
      },
      {
        invoiceNumber: "INV-2024-003",
        amount: 299.0,
        currency: "USD",
        status: "SENT",
        dueDate: daysFromNow(30),
        organizationId: org.id,
        createdAt: daysAgo(1),
      },
    ],
  });
  console.log("💰 Created 3 invoices");

  await db.subscription.create({
    data: {
      plan: "pro",
      status: "ACTIVE",
      currentPeriodStart: daysAgo(30),
      currentPeriodEnd: daysFromNow(30),
      organizationId: org.id,
    },
  });
  console.log("💳 Created subscription");

  // ══════════════════════════════════════════
  // 18. ACTIVITY LOGS (~20)
  // ══════════════════════════════════════════
  const activityLogsData = [
    {
      action: "project.created",
      message: "Alex Chen created project 'NexDesk Platform v2.0'",
      userId: users[0].id,
      organizationId: org.id,
      createdAt: daysAgo(45),
    },
    {
      action: "project.created",
      message: "Sarah Mitchell created project 'Mobile App'",
      userId: users[1].id,
      organizationId: org.id,
      createdAt: daysAgo(30),
    },
    {
      action: "task.completed",
      message: 'Emily Rodriguez completed "Design new navigation system"',
      userId: users[3].id,
      organizationId: org.id,
      createdAt: daysAgo(20),
    },
    {
      action: "task.created",
      message: 'Sarah Mitchell created "Implement real-time collaboration engine"',
      userId: users[1].id,
      organizationId: org.id,
      createdAt: daysAgo(14),
    },
    {
      action: "member.joined",
      message: "Nina Patel joined the organization",
      userId: users[7].id,
      organizationId: org.id,
      createdAt: daysAgo(10),
    },
    {
      action: "task.completed",
      message: 'James Park completed "Set up React Native project structure"',
      userId: users[6].id,
      organizationId: org.id,
      createdAt: daysAgo(15),
    },
    {
      action: "project.created",
      message: "Lisa Wang created project 'Website Redesign'",
      userId: users[5].id,
      organizationId: org.id,
      createdAt: daysAgo(20),
    },
    {
      action: "task.completed",
      message: 'Marcus Johnson completed "Implement dark mode toggle"',
      userId: users[2].id,
      organizationId: org.id,
      createdAt: daysAgo(10),
    },
    {
      action: "meeting.created",
      message: "Sarah Mitchell scheduled 'Sprint Planning - Platform v2.0'",
      userId: users[1].id,
      organizationId: org.id,
      createdAt: daysAgo(1),
    },
    {
      action: "file.uploaded",
      message: 'Emily Rodriguez uploaded "Brand Guidelines v2.pdf"',
      userId: users[3].id,
      organizationId: org.id,
      createdAt: daysAgo(8),
    },
    {
      action: "comment.added",
      message: 'David Kim commented on "Implement real-time collaboration engine"',
      userId: users[4].id,
      organizationId: org.id,
      createdAt: daysAgo(3),
    },
    {
      action: "task.status_changed",
      message: 'Marcus Johnson moved "Build authentication flow" to In Progress',
      userId: users[2].id,
      organizationId: org.id,
      createdAt: daysAgo(12),
    },
    {
      action: "project.completed",
      message: 'David Kim marked "API Gateway" as completed',
      userId: users[4].id,
      organizationId: org.id,
      createdAt: daysAgo(10),
    },
    {
      action: "team.created",
      message: "Alex Chen created team 'Marketing'",
      userId: users[0].id,
      organizationId: org.id,
      createdAt: daysAgo(50),
    },
    {
      action: "task.created",
      message: 'Marcus Johnson created "Analytics Dashboard" project',
      userId: users[2].id,
      organizationId: org.id,
      createdAt: daysAgo(15),
    },
    {
      action: "milestone.reached",
      message: "NexDesk Corp reached 10,000 active users! 🎉",
      userId: users[0].id,
      organizationId: org.id,
      createdAt: daysAgo(1),
    },
    {
      action: "invoice.paid",
      message: "Payment of $299.00 received for invoice INV-2024-002",
      userId: users[0].id,
      organizationId: org.id,
      createdAt: daysAgo(30),
    },
    {
      action: "task.assigned",
      message: 'Emily Rodriguez assigned "Design dashboard layout and widgets" to herself',
      userId: users[3].id,
      organizationId: org.id,
      createdAt: daysAgo(10),
    },
    {
      action: "channel.created",
      message: 'Emily Rodriguez created channel "#design-review"',
      userId: users[3].id,
      organizationId: org.id,
      createdAt: daysAgo(35),
    },
    {
      action: "subscription.upgraded",
      message: "Organization upgraded to Pro plan",
      userId: users[0].id,
      organizationId: org.id,
      createdAt: daysAgo(90),
    },
  ];

  await db.activityLog.createMany({ data: activityLogsData });
  console.log(`📝 Created ${activityLogsData.length} activity logs`);

  // ══════════════════════════════════════════
  // 19. AUDIT LOGS (a handful)
  // ══════════════════════════════════════════
  await db.auditLog.createMany({
    data: [
      {
        action: "user.login",
        resource: "User",
        resourceId: users[0].id,
        userId: users[0].id,
        createdAt: hoursAgo(2),
      },
      {
        action: "org.settings.update",
        resource: "Organization",
        resourceId: org.id,
        details: '{"field": "plan", "oldValue": "free", "newValue": "pro"}',
        userId: users[0].id,
        createdAt: daysAgo(90),
      },
      {
        action: "project.create",
        resource: "Project",
        resourceId: projects[0].id,
        userId: users[0].id,
        createdAt: daysAgo(45),
      },
      {
        action: "member.role.update",
        resource: "OrgMember",
        details: '{"role": "MANAGER"}',
        userId: users[0].id,
        createdAt: daysAgo(85),
      },
      {
        action: "api.key.create",
        resource: "ApiKey",
        details: '{"name": "Production API Key"}',
        userId: users[4].id,
        createdAt: daysAgo(20),
      },
    ],
  });
  console.log("📋 Created 5 audit logs");

  // ══════════════════════════════════════════
  // SUMMARY
  // ══════════════════════════════════════════
  console.log("\n" + "═".repeat(50));
  console.log("✅ Seed completed successfully!");
  console.log("═".repeat(50));
  console.log(`
  Organization:  NexDesk Corp (pro plan)
  Users:         8
  Teams:         3 (Engineering, Design, Marketing)
  Projects:      6 (4 active, 1 paused, 1 completed)
  Tasks:         ${tasks.length} + ${subtasks.length} subtasks = ${tasks.length + subtasks.length} total
  Labels:        ${labelsData.length}
  Comments:      ${commentsData.length}
  Channels:      4
  Messages:      ${allMessages.length}
  Notifications: ${notificationsData.length}
  Meetings:      ${meetingsData.length}
  Files:         ${filesData.length}
  Folders:       ${folders.length + 1}
  AI Chats:      ${aiConversations.length} conversations, ${aiMessagesData.length} messages
  Invoices:      3
  Subscription:  1 (Pro plan, active)
  Activity Logs: ${activityLogsData.length}
  Audit Logs:    5
  `);

  // Print login credentials
  console.log("🔑 Demo Login Credentials:");
  console.log("   Email: alex@nexdesk.com (ORG_OWNER)");
  console.log("   Email: sarah@nexdesk.com (MANAGER)");
  console.log("   Email: marcus@nexdesk.com (EMPLOYEE)");
  console.log("   Password: any password (using placeholder hash)\n");
}

seed()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });