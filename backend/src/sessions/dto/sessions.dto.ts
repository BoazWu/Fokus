import { IsOptional, IsString, IsEnum, IsNumber, Min, Max } from 'class-validator';

export class UpdateSessionDto {
  @IsOptional()
  @IsEnum(['active', 'paused'])
  status?: 'active' | 'paused';

  @IsOptional()
  @IsNumber()
  pausedDuration?: number;
}

export class EndSessionDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  rating?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  focusedDuration?: number; // Duration shown on timer (focused time)

  @IsOptional()
  @IsNumber()
  @Min(0)
  pausedDuration?: number; // Total time paused
}

export class GetSessionsQueryDto {
  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @IsNumber()
  @Min(1)
  limit?: number = 10;
}