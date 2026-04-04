USE MedScribeDB;
GO

CREATE OR ALTER PROCEDURE usp_Backup_GenerarBackupCompleto
    @RutaDeDestino VARCHAR(500) = 'C:\Backups\MedScribeDB\'
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @NombreDelArchivo VARCHAR(500);
    SET @NombreDelArchivo = @RutaDeDestino + 'MedScribeDB_FULL_' + FORMAT(GETDATE(), 'yyyyMMdd_HHmmss') + '.bak';

    BACKUP DATABASE MedScribeDB
    TO DISK = @NombreDelArchivo
    WITH FORMAT, COMPRESSION, STATS = 10,
         NAME = N'MedScribeDB - Backup Completo';
END
GO
