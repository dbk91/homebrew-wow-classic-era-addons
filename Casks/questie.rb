cask "questie" do
  version "11.36.1"
  sha256 "fe60d98a808d4c02c9d69374aedff10ea8cdab739d4be6ad9cb1f5773f023d37"

  url "https://github.com/Questie/Questie/releases/download/v#{version}/Questie-v#{version}.zip"
  name "Questie"
  desc "Questie: The WoW Classic quest helper"
  homepage "https://github.com/Questie/Questie"

  addon_dir = File.expand_path("/Applications/World of Warcraft/_classic_era_/Interface/AddOns")

  preflight do
    FileUtils.mkdir_p addon_dir unless Dir.exist?(addon_dir)
  end

  artifact "Questie", target: "#{addon_dir}/Questie"

  zap trash: [
    "#{addon_dir}/Questie"
  ]
end
