namespace AdminPanel.Services
{
    public interface IImageService
    {
        Task<string> SaveImageAsync(IFormFile imageFile, string directory);
        void DeleteImage(string imageUrl);
    }
}
