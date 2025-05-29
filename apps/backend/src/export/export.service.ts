import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as ExcelJS from 'exceljs';
import { WorkoutSession } from '../workouts/entities/workout-session.entity';
import { WorkoutSet } from '../workouts/entities/workout-set.entity';
import { BodyRecord } from '../body-records/entities/body-record.entity';
import { PersonalRecord } from '../personal-records/entities/personal-record.entity';

@Injectable()
export class ExportService {
  constructor(
    @InjectRepository(WorkoutSession)
    private sessionRepo: Repository<WorkoutSession>,
    @InjectRepository(WorkoutSet)
    private setRepo: Repository<WorkoutSet>,
    @InjectRepository(BodyRecord)
    private bodyRecordRepo: Repository<BodyRecord>,
    @InjectRepository(PersonalRecord)
    private prRepo: Repository<PersonalRecord>,
  ) {}

  async exportUserData(userId: number): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();

    await this.addWorkoutSessionsSheet(workbook, userId);
    await this.addWorkoutSetsSheet(workbook, userId);
    await this.addBodyRecordsSheet(workbook, userId);
    await this.addPersonalRecordsSheet(workbook, userId);

    return workbook.xlsx.writeBuffer() as Promise<Buffer>;
  }

  private async addWorkoutSessionsSheet(workbook: ExcelJS.Workbook, userId: number) {
    const sheet = workbook.addWorksheet('운동 세션');
    
    sheet.columns = [
      { header: '날짜', key: 'date', width: 15 },
      { header: '시작 시간', key: 'startTime', width: 20 },
      { header: '종료 시간', key: 'endTime', width: 20 },
      { header: '총 시간 (분)', key: 'totalTime', width: 15 },
      { header: '총 볼륨 (kg)', key: 'totalVolume', width: 15 },
      { header: '루틴', key: 'routine', width: 20 },
    ];

    const sessions = await this.sessionRepo.find({
      where: { user: { id: userId } },
      relations: ['routine'],
      order: { date: 'DESC' },
    });

    sessions.forEach(session => {
      sheet.addRow({
        date: session.date,
        startTime: session.startTime?.toLocaleString('ko-KR'),
        endTime: session.endTime?.toLocaleString('ko-KR'),
        totalTime: session.totalTime ? Math.round(session.totalTime / 60) : null,
        totalVolume: session.totalVolume,
        routine: session.routine?.name,
      });
    });

    this.formatSheet(sheet);
  }

  private async addWorkoutSetsSheet(workbook: ExcelJS.Workbook, userId: number) {
    const sheet = workbook.addWorksheet('운동 세트');
    
    sheet.columns = [
      { header: '날짜', key: 'date', width: 15 },
      { header: '운동', key: 'exercise', width: 25 },
      { header: '세트', key: 'setNumber', width: 10 },
      { header: '횟수', key: 'reps', width: 10 },
      { header: '무게 (kg)', key: 'weight', width: 12 },
      { header: '볼륨', key: 'volume', width: 12 },
    ];

    const sets = await this.setRepo
      .createQueryBuilder('set')
      .leftJoinAndSelect('set.exercise', 'exercise')
      .leftJoinAndSelect('set.workoutSession', 'session')
      .where('session.user.id = :userId', { userId })
      .orderBy('session.date', 'DESC')
      .addOrderBy('set.id', 'ASC')
      .getMany();

    sets.forEach(set => {
      sheet.addRow({
        date: set.workoutSession.date,
        exercise: set.exercise.name,
        setNumber: set.setNumber,
        reps: set.reps,
        weight: set.weight,
        volume: set.volume,
      });
    });

    this.formatSheet(sheet);
  }

  private async addBodyRecordsSheet(workbook: ExcelJS.Workbook, userId: number) {
    const sheet = workbook.addWorksheet('신체 기록');
    
    sheet.columns = [
      { header: '날짜', key: 'date', width: 15 },
      { header: '체중 (kg)', key: 'weight', width: 12 },
      { header: '체지방률 (%)', key: 'bodyFat', width: 15 },
      { header: '골격근량 (kg)', key: 'muscle', width: 15 },
    ];

    const records = await this.bodyRecordRepo.find({
      where: { user: { id: userId } },
      order: { date: 'DESC' },
    });

    records.forEach(record => {
      sheet.addRow({
        date: record.date,
        weight: record.weight,
        bodyFat: record.bodyFatPercentage,
        muscle: record.skeletalMuscleMass,
      });
    });

    this.formatSheet(sheet);
  }

  private async addPersonalRecordsSheet(workbook: ExcelJS.Workbook, userId: number) {
    const sheet = workbook.addWorksheet('개인 기록');
    
    sheet.columns = [
      { header: '운동', key: 'exercise', width: 25 },
      { header: '최고 무게 (kg)', key: 'bestWeight', width: 15 },
      { header: '최고 횟수', key: 'bestReps', width: 12 },
      { header: '추정 1RM', key: 'estimated1RM', width: 12 },
      { header: '업데이트 날짜', key: 'updatedAt', width: 20 },
    ];

    const records = await this.prRepo.find({
      where: { user: { id: userId } },
      relations: ['exercise'],
      order: { estimated1RM: 'DESC' },
    });

    records.forEach(record => {
      sheet.addRow({
        exercise: record.exercise.name,
        bestWeight: record.bestWeight,
        bestReps: record.bestReps,
        estimated1RM: record.estimated1RM,
        updatedAt: record.updatedAt.toLocaleString('ko-KR'),
      });
    });

    this.formatSheet(sheet);
  }

  private formatSheet(sheet: ExcelJS.Worksheet) {
    sheet.getRow(1).font = { bold: true };
    sheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' },
    };

    sheet.eachRow((row, rowNumber) => {
      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        };
      });
    });
  }
}