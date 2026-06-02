cask "questie" do
  version "11.29.0"
  sha256 "5b80c792971be9cc04e2cddb0da2d3f9d4625bcf4e9639409d63ae07e756afcc"

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
