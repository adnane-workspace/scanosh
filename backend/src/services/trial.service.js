import { prisma } from '../config/prisma.js';
import { buildPaginationMeta, paginatedResult, parsePaginationQuery } from '../utils/pagination.js';
import { recordActivity } from './activity.service.js';

export async function startTrial({ name, email, phone, cafeName, city = '' }) {
  const lead = await prisma.trialLead.create({
    data: {
      name: name.trim(),
      email: email.toLowerCase().trim(),
      phone: phone.trim(),
      cafeName: cafeName.trim(),
      city: city.trim(),
    },
  });

  await recordActivity({
    action: 'trial_started',
    metadata: {
      leadId: lead.id,
      leadName: lead.name,
      leadEmail: lead.email,
      leadPhone: lead.phone,
      leadCafeName: lead.cafeName,
      leadCity: lead.city,
    },
  });

  return {
    leadId: lead.id,
  };
}

export async function listTrialLeads(query = {}) {
  const { page, limit, skip } = parsePaginationQuery(query);

  const [leads, total] = await Promise.all([
    prisma.trialLead.findMany({
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.trialLead.count(),
  ]);

  return paginatedResult(
    leads.map((lead) => ({
      _id: lead.id,
      name: lead.name,
      email: lead.email,
      phone: lead.phone,
      cafeName: lead.cafeName,
      city: lead.city,
      createdAt: lead.createdAt,
    })),
    buildPaginationMeta({ page, limit, total }),
  );
}
