USE MedScribeDB;
GO

CREATE OR ALTER PROCEDURE usp_Backup_GenerarBackupDeLog
    @RutaDeDestino VARCHAR(500) = 'C:\Backups\MedScribeDB\'
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @NombreDelArchivo VARCHAR(500);
    SET @NombreDelArchivo = @RutaDeDestino + 'MedScribeDB_LOG_' + FORMAT(GETDATE(), 'yyyyMMdd_HHmmss') + '.trn';

    BACKUP LOG MedScribeDB
    TO DISK = @NombreDelArchivo
    WITH COMPRESSION, STATS = 10,
         NAME = N'MedScribeDB - Backup de Log';
END
GO
