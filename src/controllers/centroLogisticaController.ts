import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { centroLogisticaService } from "@services/centroLogisticaService";

export const useCentrosLogistica = (page?: number, limit?: number, options: any = {}) => {
  return useQuery<any>({
    queryKey: ["centrosLogistica", page, limit],
    queryFn: () => centroLogisticaService.getAll(page, limit),
    ...options,
  });
};

export const useCreateCentroLogistica = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: any) => centroLogisticaService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["centrosLogistica"] });
    },
  });
};

export const useDeleteCentroLogistica = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => centroLogisticaService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["centrosLogistica"] });
    },
  });
};
