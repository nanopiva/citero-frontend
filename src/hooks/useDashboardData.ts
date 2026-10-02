"use client";

import { useCallback, useEffect, useState } from "react";
import api from "@/lib/api";
import { parseApiError } from "@/lib/apiError";
import { todayYMD } from "@/lib/datetime";
import { WorkspaceRole, type WorkspaceResponseDto } from "@/types";
import type {
  AppointmentResponseDto,
  BusinessConfigResponseDto,
  BusinessScheduleResponseDto,
  DashboardStatsDto,
  PageResponse,
} from "@/types";

export interface DashboardData {
  stats: DashboardStatsDto | null;
  todayAppointments: AppointmentResponseDto[];
  staffTodayAppointments: AppointmentResponseDto[];
  config: BusinessConfigResponseDto | null;
  schedules: BusinessScheduleResponseDto[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

export function useDashboardData(
  activeWorkspace: WorkspaceResponseDto | null,
): DashboardData {
  const [stats, setStats] = useState<DashboardStatsDto | null>(null);
  const [todayAppointments, setTodayAppointments] = useState<
    AppointmentResponseDto[]
  >([]);
  const [staffTodayAppointments, setStaffTodayAppointments] = useState<
    AppointmentResponseDto[]
  >([]);
  const [config, setConfig] = useState<BusinessConfigResponseDto | null>(null);
  const [schedules, setSchedules] = useState<BusinessScheduleResponseDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [requestKey, setRequestKey] = useState(0);

  const refresh = useCallback(() => setRequestKey((key) => key + 1), []);

  useEffect(() => {
    if (!activeWorkspace) return;
    let active = true;

    const fetchDashboardData = async () => {
      setLoading(true);
      setError(null);

      try {
        const date = todayYMD(activeWorkspace.timezone);
        const businessId = activeWorkspace.businessId;

        if (activeWorkspace.role === WorkspaceRole.OWNER) {
          const [statsRes, appointmentsRes, configRes, schedulesRes] =
            await Promise.all([
              api.get<DashboardStatsDto>(
                `/businesses/${businessId}/dashboard`,
              ),
              api.get<PageResponse<AppointmentResponseDto>>("/appointments", {
                params: { businessId, date, size: 100 },
              }),
              api
                .get<BusinessConfigResponseDto>(
                  `/businesses/${businessId}/config`,
                )
                .catch(() => ({ data: null })),
              api
                .get<BusinessScheduleResponseDto[]>(
                  `/businesses/${businessId}/schedules`,
                )
                .catch(() => ({ data: [] as BusinessScheduleResponseDto[] })),
            ]);
          if (!active) return;
          setStats(statsRes.data);
          setTodayAppointments(appointmentsRes.data.content);
          setConfig(configRes.data);
          setSchedules(schedulesRes.data);
        } else if (activeWorkspace.role === WorkspaceRole.STAFF) {
          const appointmentsRes = await api.get<
            PageResponse<AppointmentResponseDto>
          >("/staff/appointments", {
            params: { businessId, date, size: 100 },
          });
          if (!active) return;
          setStaffTodayAppointments(appointmentsRes.data.content);
        }
      } catch (err) {
        if (!active) return;
        setError(parseApiError(err, "No pudimos cargar el panel.").message);
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchDashboardData();
    return () => {
      active = false;
    };
  }, [activeWorkspace, requestKey]);

  return {
    stats,
    todayAppointments,
    staffTodayAppointments,
    config,
    schedules,
    loading: activeWorkspace ? loading : false,
    error,
    refresh,
  };
}
