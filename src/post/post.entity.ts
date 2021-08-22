import { IsDate, IsString } from 'class-validator';
import { Subscribed } from 'src/subscribed/subscribed.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class Post {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  @IsString()
  title: string;

  @Column({ nullable: true })
  @IsString()
  thumbnail: string | null;

  @Column()
  @IsString()
  description: string;

  @OneToMany((type) => Subscribed, (subscribed) => subscribed.posts)
  subscribed: Subscribed;

  @IsDate()
  writtenDate: Date;

  @CreateDateColumn()
  @IsDate()
  createdAt: Date;

  @UpdateDateColumn()
  @IsDate()
  updatedAt: Date;
}
