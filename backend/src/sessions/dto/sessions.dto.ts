import { IsOptional, IsString, IsEnum, IsNumber, Min } from 'class-validator';

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