cask "questie" do
  version "11.33.1"
  sha256 "4c3e000c1537687aef49aaefa18479e18bc5ede52abc0609aa1c551b69d594a1"

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
